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
  const shareUrl = await getShareUrl();
  const link = document.getElementById("share-link");
  const openBtn = document.getElementById("btn-open");

  link.href = shareUrl;
  link.textContent = shareUrl;
  openBtn.href = shareUrl;

  const canvas = document.getElementById("qr-canvas");
  const fallback = document.getElementById("qr-fallback");

  try {
    await QRCode.toCanvas(canvas, shareUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#1b4d3e", light: "#ffffff" },
    });
  } catch {
    fallback.hidden = false;
    canvas.hidden = true;
    fallback.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`;
    fallback.alt = "Código QR del mapa";
  }

  document.getElementById("btn-download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "qr-mapa-armenia-2026.png";
    if (!canvas.hidden) {
      a.href = canvas.toDataURL("image/png");
    } else {
      a.href = fallback.src;
    }
    a.click();
  });
}

init();
