import {
  loadDecoraciones,
  initDecoracionesCompartir,
  getQrAsset,
} from "./decoraciones.js";

async function getShareUrl() {
  const localUrl = new URL("index.html", window.location.href).href;

  try {
    const res = await fetch("data/site.json");
    if (!res.ok) return localUrl;
    const data = await res.json();
    if (!data.shareUrl) return localUrl;

    const host = window.location.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      window.location.protocol === "file:";

    if (isLocal) return localUrl;
    return data.shareUrl.endsWith("/") ? data.shareUrl : `${data.shareUrl}/`;
  } catch {
    return localUrl;
  }
}

async function init() {
  const decor = await loadDecoraciones();
  initDecoracionesCompartir(decor);

  const qrImg = document.getElementById("qr-pauta-img");
  if (qrImg && decor) {
    qrImg.src = getQrAsset(decor);
  }

  const shareUrl = await getShareUrl();
  const link = document.getElementById("share-link");
  const openBtn = document.getElementById("btn-open");

  link.href = shareUrl;
  link.textContent = shareUrl;
  openBtn.href = shareUrl;

  document.getElementById("btn-download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "qr-mapa-armenia-2026.jpg";
    a.href = qrImg?.src || getQrAsset(decor);
    a.click();
  });
}

init();
