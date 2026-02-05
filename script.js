const TOTAL = 468;
const PER_PAGE = 10;

let currentPage = 1;
let currentFilter = "all";

const owned = new Set(JSON.parse(localStorage.getItem("owned") || "[]"));
const duplicates = new Map(Object.entries(JSON.parse(localStorage.getItem("duplicates") || "{}")).map(([k,v]) => [Number(k), v]));
const customImages = JSON.parse(localStorage.getItem("customImages") || "{}");

const grid = document.getElementById("grid");
const pageInfo = document.getElementById("pageInfo");

function saveState() {
  localStorage.setItem("owned", JSON.stringify([...owned]));
  localStorage.setItem("duplicates", JSON.stringify(Object.fromEntries(duplicates)));
  localStorage.setItem("customImages", JSON.stringify(customImages));
}

function isOwned(id) {
  return owned.has(id) || (duplicates.get(id) || 0) > 0;
}

function getFiltered() {
  return Array.from({length: TOTAL}, (_, i) => i + 1).filter(id => {
    if (currentFilter === "owned") return isOwned(id);
    if (currentFilter === "missing") return !isOwned(id);
    if (currentFilter === "duplicates") return (duplicates.get(id) || 0) > 0;
    return true;
  });
}

function getImageSrc(id) {
  return customImages[id] || `img/${id}.jpg`;
}

function render() {
  grid.innerHTML = "";
  const list = getFiltered();
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);

  const pageItems = list.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  pageItems.forEach(id => {
    const card = document.createElement("div");
    card.className = "card" + (isOwned(id) ? " owned" : "");

    const img = document.createElement("img");
    img.src = getImageSrc(id);
    img.onerror = () => img.src = "img/placeholder.jpg";

    img.onclick = () => {
      document.getElementById("photoInput").onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          customImages[id] = reader.result;
          saveState();
          render();
        };
        reader.readAsDataURL(file);
      };
      if (!customImages[id]) document.getElementById("photoInput").click();
    };

    card.appendChild(img);
    card.appendChild(document.createTextNode(id));

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
        dupCount > 1 ? duplicates.set(id, dupCount - 1) : duplicates.delete(id);
        saveState(); render();
      };
      card.appendChild(minus);
    }

    card.onclick = () => {
      owned.has(id) ? owned.delete(id) : owned.add(id);
      saveState(); render();
    };

    card.oncontextmenu = e => {
      e.preventDefault();
      duplicates.set(id, (duplicates.get(id) || 0) + 1);
      owned.add(id);
      saveState(); render();
    };

    grid.appendChild(card);
  });

  pageInfo.textContent = `Pàgina ${currentPage} / ${totalPages}`;
  updateCounters();
}

function updateCounters() {
  let ownedCount = 0, dupCount = 0;
  for (let i = 1; i <= TOTAL; i++) {
    if (isOwned(i)) ownedCount++;
    dupCount += duplicates.get(i) || 0;
  }
  document.getElementById("ownedCount").textContent = `Tinc: ${ownedCount}`;
  document.getElementById("missingCount").textContent = `Falten: ${TOTAL - ownedCount}`;
  document.getElementById("dupCount").textContent = `Duplicats: ${dupCount}`;
}

/* PAGINACIÓ */
document.getElementById("prevPage").onclick = () => { if (currentPage > 1) currentPage--; render(); };
document.getElementById("nextPage").onclick = () => { currentPage++; render(); };

/* FILTRES */
document.querySelectorAll("#filters button").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    render();
  };
});

/* EXPORT / IMPORT */
document.getElementById("exportBtn").onclick = () => {
  const data = {
    owned: [...owned],
    duplicates: Object.fromEntries(duplicates),
    customImages
  };
  const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "album-468.json";
  a.click();
};

document.getElementById("importBtn").onclick = () =>
  document.getElementById("importFile").click();

document.getElementById("importFile").onchange = e => {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    owned.clear(); data.owned.forEach(o => owned.add(o));
    duplicates.clear(); Object.entries(data.duplicates).forEach(([k,v]) => duplicates.set(+k, v));
    Object.assign(customImages, data.customImages || {});
    saveState(); render();
  };
  reader.readAsText(e.target.files[0]);
};

render();
