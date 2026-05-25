/** Decoración visual desde /decoraciones — no altera la estructura del mapa. */

export async function loadDecoraciones() {
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

export function initDecoracionesMapa(config) {
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

export function initDecoracionesCompartir(config) {
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

export function initFichaDecor(config) {
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

export function getQrAsset(config) {
  return config?.qr?.imagen || "assets/qr-mapa-armenia-display.jpg";
}
