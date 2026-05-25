// Mapa Armenia 2026 - JavaScript sin módulos ES

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

// Cargar decoraciones
async function loadDecoraciones() {
  try {
    const res = await fetch("data/decoraciones.json");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function setDecorVar(id, capa) {
  if (!capa?.archivo) return;
  const root = document.documentElement;
  root.style.setProperty(`--decor-${id}`, `url("${capa.archivo}")`);
  root.style.setProperty(`--decor-${id}-opacity`, String(capa.opacidad ?? 0.15));
}

function renderAcentos(acentos, contenedor) {
  if (!contenedor || !acentos?.length) return;

  contenedor.innerHTML = acentos
    .map(
      (a) => `
    <img
      class="decor-acento decor-acento--${a.zona}"
      src="${a.archivo}"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style="--acento-size: ${a.tamano || "120px"}"
      data-acento-id="${a.id || ""}"
    />
  `
    )
    .join("");
}

function ensureAccentContainer() {
  let el = document.getElementById("decor-accents");
  if (!el) {
    el = document.createElement("div");
    el.id = "decor-accents";
    el.className = "decor-accents";
    el.setAttribute("aria-hidden", "true");
    document.body.prepend(el);
  }
  return el;
}

function initDecoracionesMapa(config) {
  if (!config) return;

  for (const capa of config.capas || []) {
    setDecorVar(capa.id, capa);
  }

  const container = document.getElementById("decor-accents");
  if (container) container.innerHTML = "";

  if (config.acentos?.length) {
    renderAcentos(config.acentos, ensureAccentContainer());
  }

  document.body.classList.add("decor-activo");
}

function initFichaDecor(config) {
  const f = config?.ficha;
  if (!f) return;
  const root = document.documentElement;
  if (f.fondo) {
    root.style.setProperty("--ficha-bg", `url("${f.fondo}")`);
    root.style.setProperty("--ficha-bg-opacity", String(f.opacidad ?? 0.12));
  }
  if (f.acento) {
    root.style.setProperty("--ficha-acento", `url("${f.acento}")`);
  }
}

function initDecoracionesCompartir(config) {
  if (!config?.compartir) return;
  const { fondo, opacidad, acentos } = config.compartir;
  document.documentElement.style.setProperty("--compartir-bg", `url("${fondo}")`);
  document.documentElement.style.setProperty(
    "--compartir-bg-opacity",
    String(opacidad ?? 0.25)
  );

  document.body.classList.add("decor-compartir");

  if (acentos && config.acentos?.length) {
    renderAcentos(config.acentos, ensureAccentContainer());
  }
}

function getQrAsset(config) {
  return config?.qr?.imagen || "assets/qr-mapa-armenia-display.jpg";
}

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

function shortMarkerLabel(name) {
  const text = (name || "").split("·")[0].trim();
  if (text.length <= 22) return text;
  return `${text.slice(0, 20)}…`;
}

function createMarkerIcon(poi) {
  const pauta = poi.pautaId ? pautasById.get(poi.pautaId) : null;
  const isPauta = Boolean(pauta);
  const label = shortMarkerLabel(poi.name);
  const thumb =
    isPauta && pauta.imagen
      ? `<div class="poi-marker-thumb"><img src="${escapeHtml(pauta.imagen)}" alt="" /></div>`
      : "";

  const html = `
    <div class="poi-marker-wrap ${isPauta ? "poi-marker-wrap--pauta" : ""} poi-marker-wrap--${poi.category}">
      <span class="poi-marker-label">${escapeHtml(label)}</span>
      ${thumb}
      <div class="poi-marker-pin poi-marker-pin--${poi.category}" aria-hidden="true"></div>
    </div>
  `;

  const width = isPauta ? 116 : Math.min(130, Math.max(72, label.length * 6.5 + 24));
  const height = isPauta ? 82 : 54;

  return L.divIcon({
    className: "poi-marker-leaflet",
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 6],
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const WA_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

function whatsappUrl(pauta) {
  const num = (pauta.whatsapp || pauta.telefono || "").replace(/\D/g, "");
  const full = num.startsWith("57") ? num : `57${num}`;
  const text = encodeURIComponent(
    pauta.whatsappMensaje ||
      `Hola, vi ${pauta.nombre} en el Mapa Turístico Armenia 2026. Me gustaría más información.`
  );
  return `https://wa.me/${full}?text=${text}`;
}

function telefonoHref(tel) {
  const n = tel.replace(/\D/g, "");
  return `tel:+57${n.startsWith("57") ? n.slice(2) : n}`;
}

function comoLlegarUrl(pauta) {
  const poi = poisData.find((p) => p.id === pauta.poiId);
  if (poi) {
    return `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
  }
  const dest = pauta.direccion
    ? `${pauta.direccion}, Armenia, Quindío, Colombia`
    : "Armenia, Quindío";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

function popupHtml(poi) {
  const pauta = poi.pautaId ? pautasById.get(poi.pautaId) : null;
  const tel = poi.telefono || pauta?.telefono;
  const horario = poi.horario || pauta?.horario;
  const address = poi.address || pauta?.direccion;

  let actions = "";
  if (pauta) {
    actions = `<div class="popup-actions">
      <a href="#" class="popup-btn-ficha" data-ficha-id="${escapeHtml(pauta.id)}">Ver ficha</a>
      <a href="${comoLlegarUrl(pauta)}" class="popup-btn-llegar" target="_blank" rel="noopener">Cómo llegar</a>
      ${pauta.telefono ? `<a href="${telefonoHref(pauta.telefono)}" class="popup-btn-llamar">Llamar</a>` : ""}
      ${pauta.whatsapp || pauta.telefono ? `<a href="${whatsappUrl(pauta)}" class="popup-btn-wa" target="_blank" rel="noopener">WhatsApp</a>` : ""}
    </div>`;
  }

  return `
    <div class="popup-body">
      <span class="popup-cat">${CATEGORY_LABELS[poi.category]}</span>
      <h3>${escapeHtml(poi.name)}</h3>
      <p>${escapeHtml(poi.description)}</p>
      ${address ? `<p><strong>Dirección:</strong> ${escapeHtml(address)}</p>` : ""}
      ${tel ? `<p><strong>Tel:</strong> <a href="${telefonoHref(tel)}">${escapeHtml(tel)}</a></p>` : ""}
      ${horario ? `<p><strong>Horario:</strong> ${escapeHtml(horario)}</p>` : ""}
      ${actions}
    </div>
  `;
}

function buildFichaHtml(pauta) {
  const ficha = pauta.ficha || {};
  const servicios = (ficha.servicios || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");
  const wa = pauta.whatsapp || pauta.telefono;

  return `
    <div class="ficha-inner">
      <div class="ficha-hero">
        <img src="${escapeHtml(pauta.imagen)}" alt="Pauta ${escapeHtml(pauta.nombre)}" />
        <span class="ficha-hero-badge">Pauta publicitaria</span>
      </div>
      <div class="ficha-scroll">
        <div class="ficha-body">
          ${pauta.categoria ? `<span class="ficha-cat">${escapeHtml(pauta.categoria)}</span>` : ""}
          <h2 id="ficha-titulo">${escapeHtml(pauta.nombre)}</h2>
          ${pauta.slogan ? `<p class="ficha-slogan">${escapeHtml(pauta.slogan)}</p>` : ""}
          ${ficha.destacado ? `<p class="ficha-destacado">${escapeHtml(ficha.destacado)}</p>` : ""}
          ${ficha.descripcion ? `<p class="ficha-descripcion">${escapeHtml(ficha.descripcion)}</p>` : ""}
          ${servicios ? `<section class="ficha-servicios"><h3>Servicios</h3><ul>${servicios}</ul></section>` : ""}
          <section class="ficha-datos">
            <h3>Información de contacto</h3>
            <dl>
              ${pauta.direccion ? `<div class="ficha-dato"><dt>Dirección</dt><dd>${escapeHtml(pauta.direccion)}</dd></div>` : ""}
              ${pauta.horario ? `<div class="ficha-dato"><dt>Horario</dt><dd>${escapeHtml(pauta.horario)}</dd></div>` : ""}
              ${pauta.telefono ? `<div class="ficha-dato"><dt>Teléfono</dt><dd><a href="${telefonoHref(pauta.telefono)}">${escapeHtml(pauta.telefono)}</a></dd></div>` : ""}
            </dl>
          </section>
        </div>
      </div>
      <footer class="ficha-actions">
        <p class="ficha-actions-title">Contacto y ubicación</p>
        <a class="btn btn-llegar" href="${comoLlegarUrl(pauta)}" target="_blank" rel="noopener">Cómo llegar</a>
        ${pauta.telefono ? `<a class="btn btn-llamar" href="${telefonoHref(pauta.telefono)}">Llamar</a>` : ""}
        ${wa ? `<a class="btn btn-whatsapp" href="${whatsappUrl(pauta)}" target="_blank" rel="noopener">${WA_ICON} Escribir por WhatsApp</a>` : ""}
        <button type="button" class="ficha-link-mapa" data-ficha-mapa="${escapeHtml(pauta.poiId)}">Ver ubicación en el mapa</button>
      </footer>
    </div>
  `;
}

function openFicha(pautaId) {
  const pauta = pautasById.get(pautaId);
  const modal = document.getElementById("ficha-modal");
  const content = document.getElementById("ficha-content");
  if (!pauta || !modal || !content) return;

  content.innerHTML = buildFichaHtml(pauta);
  content.scrollTop = 0;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("ficha-open");

  const scrollEl = content.querySelector(".ficha-scroll");
  if (scrollEl) scrollEl.scrollTop = 0;

  content.querySelector("[data-ficha-mapa]")?.addEventListener("click", () => {
    closeFicha();
    focusPoi(pauta.poiId);
  });

  requestAnimationFrame(() => {
    const dialog = modal.querySelector(".ficha-dialog");
    if (dialog) dialog.scrollTop = 0;
  });
}

function closeFicha() {
  const modal = document.getElementById("ficha-modal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("ficha-open");
}

function initFichaModal() {
  const modal = document.getElementById("ficha-modal");
  if (!modal) return;

  modal.querySelectorAll("[data-ficha-close]").forEach((el) => {
    el.addEventListener("click", closeFicha);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeFicha();
  });

  document.getElementById("map")?.addEventListener("click", (e) => {
    const link = e.target.closest?.("[data-ficha-id]");
    if (!link) return;
    e.preventDefault();
    openFicha(link.dataset.fichaId);
  });
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
      <button type="button" class="pauta-card-btn" data-pauta-id="${escapeHtml(p.id)}" title="Abrir ficha informativa">
        <img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)} — ${escapeHtml(p.slogan || "")}" loading="lazy" />
      </button>
      <p class="pauta-card-meta">${escapeHtml(p.direccion || "")}</p>
      ${p.telefono ? `<p class="pauta-card-tel"><a href="tel:+57${p.telefono.replace(/\D/g, "")}">${escapeHtml(p.telefono)}</a></p>` : ""}
      <p class="pauta-card-hint">Clic para abrir ficha informativa</p>
    </article>
  `
    )
    .join("");

  container.querySelectorAll(".pauta-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => openFicha(btn.dataset.pautaId));
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
      icon: createMarkerIcon(poi),
      title: poi.name,
      zIndexOffset: poi.pautaId ? 800 : 0,
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
    const [{ meta, pois }, pautas, decor] = await Promise.all([
      loadPois(),
      loadPautas(),
      loadDecoraciones(),
    ]);
    poisData = pois;
    pautasById = new Map(pautas.map((p) => [p.id, p]));
    initDecoracionesMapa(decor);
    initFichaDecor(decor);
    initMap(meta);
    initFichaModal();
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
