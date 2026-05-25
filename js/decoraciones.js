/** Aplica fondos desde decoraciones/ sin modificar el HTML del mapa. */

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

export function initDecoracionesMapa(config) {
  if (!config?.capas) return;
  for (const capa of config.capas) {
    setDecorVar(capa.id, capa);
  }
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
