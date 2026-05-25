// Compartir - JavaScript sin módulos ES

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
  // Cargar decoraciones
  let decor = null;
  try {
    const res = await fetch("data/decoraciones.json");
    if (res.ok) {
      decor = await res.json();
    }
  } catch {
    // Silently handle errors
  }

  // Inicializar decoraciones para compartir
  if (decor && decor.compartir) {
    const { fondo, opacidad, acentos } = decor.compartir;
    document.documentElement.style.setProperty("--compartir-bg", `url("${fondo}")`);
    document.documentElement.style.setProperty(
      "--compartir-bg-opacity",
      String(opacidad ?? 0.25)
    );

    document.body.classList.add("decor-compartir");

    if (acentos && decor.acentos?.length) {
      let el = document.getElementById("decor-accents");
      if (!el) {
        el = document.createElement("div");
        el.id = "decor-accents";
        el.className = "decor-accents";
        el.setAttribute("aria-hidden", "true");
        document.body.prepend(el);
      }
      el.innerHTML = decor.acentos
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
  }

  const qrImg = document.getElementById("qr-pauta-img");
  if (qrImg && decor) {
    qrImg.src = decor.qr?.imagen || "assets/qr-mapa-armenia-display.jpg";
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
    a.href = qrImg?.src || (decor?.qr?.imagen || "assets/qr-mapa-armenia-display.jpg");
    a.click();
  });
}

init();
