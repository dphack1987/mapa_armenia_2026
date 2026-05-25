"""Genera PNG del QR para impresión (usa data/site.json)."""
import json
from pathlib import Path

try:
    import qrcode
except ImportError:
    raise SystemExit("Instala: pip install qrcode[pil]")

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "data" / "site.json"
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)


def main() -> None:
    data = json.loads(SITE.read_text(encoding="utf-8"))
    url = data.get("shareUrl", "https://dphack1987.github.io/mapa_armenia_2026/")
    dest = OUT / "qr-mapa-armenia-2026.png"

    qr = qrcode.QRCode(version=None, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1b4d3e", back_color="white")
    img.save(dest)
    print(f"QR guardado: {dest}")
    print(f"URL: {url}")


if __name__ == "__main__":
    main()
