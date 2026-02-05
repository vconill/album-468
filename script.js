const TOTAL = 468;
const PER_PAGE = 10;

let currentPage = 1;
let currentFilter = "all";

/* ESTAT */
const owned = new Set(JSON.parse(localStorage.getItem("owned") || "[]"));
const duplicates = new Map(
  Object.entries(JSON.parse(localStorage.getItem("duplicates") || "{}"))
    .map(([k, v]) => [Number(k), v])
);
const customImages = JSON.parse(localStorage.getItem("customImages") || "{}");
const missingImages = JSON.parse(localStorage.getItem("missingImages") || "[]");

/* DOM */
const grid = document.getElementById("grid");
const pageInfo = document.getElementById("pageInfo");
const photoInput = document.getElementById("photoInput");

/* PERSISTÈNCIA */
function saveState() {
  localStorage.setItem("owned", JSON.stringify([...owned]));
  localStorage.setItem("duplicates", JSON.stringify(Object.fromEntries(duplicates)));
  localStorage.setItem("customImages", JSON.stringify(customImages));
  localStorage.setItem("missingImages", JSON.stringify(missingImages));
}

/* UTILITATS */
function isOwned(id) {
  return owned.has(id) || (duplicates.get(id) || 0) > 0;
}

function getImageSrc(id) {
  if (customImages[id]) return customImages[id];
  if (missingImages.includes(id)) return "img/placeholder.jpg";
  return `img/${id}.jpg`;
}

function getFiltered() {
  return Array.from({ length: TOTAL }, (_, i) => i + 1).filter(id => {
    if (currentFilter === "owned") return isOwned(id);
    if (currentFilter === "missing") return !isOwned(id);
    if (currentFilter === "duplicates") return (duplicates.get(id) || 0) > 0;
    return true;
  });
}

/* RENDER */
function render() {
  grid.innerHTML = "";

  const list = getFiltered();
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = list.slice(start, start + PER_PAGE);

  pageItems.forEach(id => {
    const card = document.createElement("div");
    card.className = "card" + (isOwned(id) ? " owned" : "");

    const img = document.createElement("img");
    img.src = getImageSrc(id);

    img.onerror = () => {
      if (!missingImages.includes(id)) {
        missingImages.push(id);
        saveState();
      }
      img.src = "img/placeholder.jpg";
    };

    /* PUJAR FOTO NOMÉS SI NO EXISTEIX */
    img.onclick = e => {
      e.stopPropagation();
      if (!missingImages.includes(id)) return;

      photoInput.onchange = ev => {
        const file = ev.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          customImages[id] = reader.result;
          const idx = missingImages.indexOf(id);
          if (idx !== -1) missingImages.splice(idx, 1);
          saveState();
          render();
        };
        reader.readAsDataURL(file);
      };
      photoInput.click();
    };

    card.appendChild(img);
    card.appendChild(document.createTextNode(id));

    /* DUPLICATS */
    const dupCount = duplicates.get(id) || 0;
    if (dupCount > 0) {
      const badge = document.createElement("div");
      badge.className = "dup";
      badge.textContent = `+${dupCount}`;
      card.appendChild(badge);

      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.style.position = "absolute";
      minus.style.bottom = "4px";
      minus.style.right = "4px";
      minus.onclick = e => {
        e.stopPropagation();
        dupCount > 1
          ? duplicates.set(id, dupCount - 1)
          : duplicates.delete(id);
        saveState();
        render();
      };
      card.appendChild(minus);
    }

    /* TAP NORMAL: TINC / NO TINC */
    card.onclick = () => {
      owned.has(id) ? owned.delete(id) : owned.add(id);
      saveState();
      render();
    };

    /* TAP LLARG / CLIC DRET: AFEGIR DUPLICAT */
    card.oncontextmenu = e => {
      e.preventDefault();
      duplicates.set(id, (duplicates.get(id) || 0) + 1);
      owned.add(id);
      saveState();
      render();
    };

    grid.appendChild(card);
  });

  pageInfo.textContent = `Pàgina ${currentPage} / ${totalPages}`;
  updateCounters();
}

/* COMPTADORS */
function updateCounters() {
  let ownedCount = 0;
  let dupCount = 0;

  for (let i = 1; i <= TOTAL; i++) {
    if (isOwned(i)) ownedCount++;
    dupCount += duplicates.get(i) || 0;
  }

  document.getElementById("ownedCount").textContent = `Tinc: ${ownedCount}`;
  document.getElementById("missingCount").textContent = `Falten: ${TOTAL - ownedCount}`;
  document.getElementById("dupCount").textContent = `Duplicats: ${dupCount}`;
}

/* PAGINACIÓ */
document.getElementById("prevPage").onclick = () => {
  if (currentPage > 1) currentPage--;
  render();
};

document.getElementById("nextPage").onclick = () => {
  currentPage++;
  render();
};

/* FILTRES */
document.querySelectorAll("#filters button").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    render();
  };
});

/* EXPORTAR */
document.getElementById("exportBtn").onclick = () => {
  const data = {
    owned: [...owned],
    duplicates: Object.fromEntries(duplicates),
    customImages,
    missingImages
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "album-468.json";
  a.click();
};

/* IMPORTAR */
document.getElementById("importBtn").onclick = () =>
  document.getElementById("importFile").click();

document.getElementById("importFile").onchange = e => {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);

    owned.clear();
    data.owned.forEach(id => owned.add(id));

    duplicates.clear();
    Object.entries(data.duplicates).forEach(([k, v]) =>
      duplicates.set(+k, v)
    );

    Object.assign(customImages, data.customImages || []);

    missingImages.length = 0;
    (data.missingImages || []).forEach(id => missingImages.push(id));

    saveState();
    render();
  };
  reader.readAsText(e.target.files[0]);
};

/* INIT */
render();

/* QA BÀSIC */
console.assert(TOTAL === 468, "❌ Total incorrecte");
console.assert(PER_PAGE === 10, "❌ Paginació incorrecta");
console.log("✅ script.js carregat correctament");
