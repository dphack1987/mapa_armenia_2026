const CATEGORY_LABELS = {
  turistico: "Turístico",
  comercial: "Comercial",
  gastronomico: "Gastronómico",
};

let map;
let markersLayer;
let poisData = [];
let pautasById = new Map();
let activeCategories = new Set(["turistico", "comercial", "gastronomico"]);
let markerById = new Map();

async function loadPautas() {
  const res = await fetch("data/pautas.json");
  if (!res.ok) return [];
  const data = await res.json();
  return data.pautas || [];
}

async function loadPois() {
  const res = await fetch("data/pois.json");
  if (!res.ok) throw new Error("No se pudo cargar data/pois.json");
  const data = await res.json();
  return data;
}

function createMarkerIcon(category) {
  return L.divIcon({
    className: "",
    html: `<div class="poi-marker poi-marker-${category}" aria-hidden="true"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function popupHtml(poi) {
  const pauta = poi.pautaId ? pautasById.get(poi.pautaId) : null;
  const pautaBlock = pauta
    ? `<figure class="popup-pauta"><img src="${escapeHtml(pauta.imagen)}" alt="Pauta ${escapeHtml(pauta.nombre)}" loading="lazy" /></figure>`
    : "";
  const tel = poi.telefono
    ? `<p><strong>Tel:</strong> <a href="tel:+57${poi.telefono.replace(/\D/g, "")}">${escapeHtml(poi.telefono)}</a></p>`
    : "";
  const horario = poi.horario ? `<p><strong>Horario:</strong> ${escapeHtml(poi.horario)}</p>` : "";

  return `
    <div class="popup-body">
      ${pautaBlock}
      <span class="popup-cat">${CATEGORY_LABELS[poi.category]}</span>
      <h3>${escapeHtml(poi.name)}</h3>
      <p>${escapeHtml(poi.description)}</p>
      ${poi.address ? `<p><strong>Dirección:</strong> ${escapeHtml(poi.address)}</p>` : ""}
      ${tel}
      ${horario}
    </div>
  `;
}

function renderPautas() {
  const container = document.getElementById("pautas-list");
  const panel = document.getElementById("pautas-panel");
  if (!container) return;

  const pautas = [...pautasById.values()];
  if (pautas.length === 0) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  container.innerHTML = pautas
    .map(
      (p) => `
    <article class="pauta-card">
      <button type="button" class="pauta-card-btn" data-poi-id="${escapeHtml(p.poiId)}" title="Ver en el mapa">
        <img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)} — ${escapeHtml(p.slogan || "")}" loading="lazy" />
      </button>
      <p class="pauta-card-meta">${escapeHtml(p.direccion || "")}</p>
      ${p.telefono ? `<p class="pauta-card-tel"><a href="tel:+57${p.telefono.replace(/\D/g, "")}">${escapeHtml(p.telefono)}</a></p>` : ""}
    </article>
  `
    )
    .join("");

  container.querySelectorAll(".pauta-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => focusPoi(btn.dataset.poiId));
  });
}

function filteredPois() {
  return poisData.filter((p) => activeCategories.has(p.category));
}

function renderMarkers() {
  markersLayer.clearLayers();
  markerById.clear();

  for (const poi of filteredPois()) {
    const marker = L.marker([poi.lat, poi.lng], {
      icon: createMarkerIcon(poi.category),
      title: poi.name,
    });
    marker.bindPopup(popupHtml(poi));
    marker.on("click", () => highlightListItem(poi.id));
    marker.addTo(markersLayer);
    markerById.set(poi.id, marker);
  }

  updatePoiCount();
  renderList();
}

function renderList(query = "") {
  const list = document.getElementById("poi-list");
  const q = query.trim().toLowerCase();
  const items = filteredPois().filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.address && p.address.toLowerCase().includes(q))
  );

  list.innerHTML = items
    .map(
      (poi) => `
    <li class="poi-item cat-${poi.category}">
      <button type="button" data-id="${poi.id}">
        <span class="poi-name">${poi.name}</span>
        <span class="poi-cat">${CATEGORY_LABELS[poi.category]}</span>
      </button>
    </li>
  `
    )
    .join("");

  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => focusPoi(btn.dataset.id));
  });
}

function updatePoiCount() {
  document.getElementById("poi-count").textContent = String(filteredPois().length);
}

function highlightListItem(id) {
  document.querySelectorAll(".poi-item button").forEach((b) => b.classList.remove("active"));
  const btn = document.querySelector(`.poi-item button[data-id="${id}"]`);
  if (btn) {
    btn.classList.add("active");
    btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function focusPoi(id) {
  const poi = poisData.find((p) => p.id === id);
  const marker = markerById.get(id);
  if (!poi || !marker) return;

  map.setView([poi.lat, poi.lng], 16, { animate: true });
  marker.openPopup();
  highlightListItem(id);
  showStatus(poi.name);
}

function showStatus(text) {
  const el = document.getElementById("map-status");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => el.classList.remove("visible"), 2500);
}

function syncFiltersFromUI() {
  const allCheckbox = document.querySelector('.filter-all input[value="all"]');
  const catInputs = [...document.querySelectorAll('.filter-group input:not([value="all"])')];

  if (allCheckbox.checked) {
    activeCategories = new Set(["turistico", "comercial", "gastronomico"]);
    catInputs.forEach((i) => {
      i.checked = true;
      i.disabled = true;
    });
  } else {
    catInputs.forEach((i) => {
      i.disabled = false;
    });
    activeCategories = new Set(
      catInputs.filter((i) => i.checked).map((i) => i.value)
    );
    if (activeCategories.size === 0) {
      allCheckbox.checked = true;
      return syncFiltersFromUI();
    }
  }

  renderMarkers();
}

function initFilters() {
  const allCheckbox = document.querySelector('.filter-all input[value="all"]');
  const catInputs = [...document.querySelectorAll('.filter-group input:not([value="all"])')];

  allCheckbox.addEventListener("change", () => {
    if (allCheckbox.checked) {
      catInputs.forEach((i) => {
        i.checked = true;
      });
    }
    syncFiltersFromUI();
  });

  catInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (catInputs.some((i) => !i.checked)) {
        allCheckbox.checked = false;
      } else {
        allCheckbox.checked = true;
      }
      syncFiltersFromUI();
    });
  });

  syncFiltersFromUI();
}

function initSearch() {
  const input = document.getElementById("search-poi");
  input.addEventListener("input", () => renderList(input.value));
}

function initLocate() {
  document.getElementById("btn-locate").addEventListener("click", () => {
    if (!navigator.geolocation) {
      showStatus("Geolocalización no disponible en este navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#66c2be",
          fillColor: "#66c2be",
          fillOpacity: 0.5,
        })
          .addTo(map)
          .bindPopup("Tu ubicación")
          .openPopup();
        showStatus("Ubicación encontrada");
      },
      () => showStatus("No se pudo obtener tu ubicación")
    );
  });
}

function initMap(meta) {
  map = L.map("map", { zoomControl: true }).setView(meta.center, meta.defaultZoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

async function init() {
  try {
    const [{ meta, pois }, pautas] = await Promise.all([loadPois(), loadPautas()]);
    poisData = pois;
    pautasById = new Map(pautas.map((p) => [p.id, p]));
    initMap(meta);
    renderPautas();
    initFilters();
    initSearch();
    initLocate();
    renderMarkers();
    showStatus("Mapa listo · Armenia, Quindío 2026");
  } catch (err) {
    console.error(err);
    document.getElementById("map-status").textContent =
      "Error al cargar el mapa. Abre el proyecto con un servidor local.";
    document.getElementById("map-status").classList.add("visible");
  }
}

init();
