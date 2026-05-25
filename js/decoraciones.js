export async function loadDecoraciones() {
  try {
    const res = await fetch("data/decoraciones.json");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function applyCapa(capa) {
  const el = document.querySelector(`[data-decor="${capa.id}"]`);
  if (!el || !capa.archivo) return;

  el.style.backgroundImage = `url("${capa.archivo}")`;
  el.style.opacity = String(capa.opacidad ?? 0.15);
  if (capa.blend) el.style.mixBlendMode = capa.blend;
  if (capa.posicion) el.style.backgroundPosition = capa.posicion;
  if (capa.size) el.style.backgroundSize = capa.size;
}

export function initDecoracionesMapa(config) {
  if (!config) return;

  for (const capa of config.capas || []) {
    applyCapa(capa);
  }

  const qr = config.qr;
  const panel = document.getElementById("qr-panel");
  const img = document.getElementById("qr-panel-img");
  const lead = document.getElementById("qr-panel-lead");

  if (!panel || !img || !qr) return;

  img.src = qr.imagen;
  img.alt = qr.titulo || "Código QR Mapa Armenia 2026";
  if (lead) lead.textContent = qr.subtitulo || "";

  img.addEventListener("click", () => {
    window.location.href = "compartir.html";
  });
}

export function initDecoracionesCompartir(config) {
  if (!config?.compartir) return;
  const { fondo, opacidad } = config.compartir;
  document.documentElement.style.setProperty("--compartir-bg", `url("${fondo}")`);
  document.documentElement.style.setProperty(
    "--compartir-bg-opacity",
    String(opacidad ?? 0.2)
  );
}

export function getQrAsset(config) {
  return config?.qr?.imagen || "assets/qr-mapa-armenia-display.jpg";
}
