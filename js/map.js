const CATEGORY_LABELS = {
  turistico: "Turístico",
  comercial: "Comercial",
  gastronomico: "Gastronómico",
};

let map;
let markersLayer;
let poisData = [];
let activeCategories = new Set(["turistico", "comercial", "gastronomico"]);
let markerById = new Map();

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

function popupHtml(poi) {
  return `
    <div>
      <span class="popup-cat">${CATEGORY_LABELS[poi.category]}</span>
      <h3>${poi.name}</h3>
      <p>${poi.description}</p>
      ${poi.address ? `<p><strong>Dirección:</strong> ${poi.address}</p>` : ""}
    </div>
  `;
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
    const { meta, pois } = await loadPois();
    poisData = pois;
    initMap(meta);
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
