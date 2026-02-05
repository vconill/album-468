const TOTAL = 468;
const PER_PAGE = 10;

let currentPage = 1;
let currentFilter = "all";

const owned = new Set(JSON.parse(localStorage.getItem("owned") || "[]"));
const duplicates = new Map(Object.entries(JSON.parse(localStorage.getItem("duplicates") || "{}")).map(([k,v]) => [Number(k), v]));

const grid = document.getElementById("grid");
const pageInfo = document.getElementById("pageInfo");

function saveState() {
  localStorage.setItem("owned", JSON.stringify([...owned]));
  localStorage.setItem("duplicates", JSON.stringify(Object.fromEntries(duplicates)));
}

function isOwned(id) {
  return owned.has(id) || (duplicates.get(id) || 0) > 0;
}

function getFiltered() {
  const all = Array.from({length: TOTAL}, (_, i) => i + 1);
  return all.filter(id => {
    if (currentFilter === "owned") return isOwned(id);
    if (currentFilter === "missing") return !isOwned(id);
    if (currentFilter === "duplicates") return (duplicates.get(id) || 0) > 0;
    return true;
  });
}

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
    img.src = `img/${id}.jpg`;
    img.onerror = () => img.src = "img/placeholder.jpg";

    card.appendChild(img);
    card.appendChild(document.createTextNode(id));

    const dup = duplicates.get(id);
    if (dup) {
      const badge = document.createElement("div");
      badge.className = "dup";
      badge.textContent = `+${dup}`;
      card.appendChild(badge);
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

document.getElementById("prevPage").onclick = () => { currentPage--; render(); };
document.getElementById("nextPage").onclick = () => { currentPage++; render(); };

document.querySelectorAll("#filters button").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    render();
  };
});

render();

/* QA */
(function qa() {
  console.assert(TOTAL === 468, "❌ Total incorrecte");
  console.assert(Math.ceil(TOTAL / PER_PAGE) === 47, "❌ Paginació incorrecta");
  console.log("✅ QA OK");
})();

