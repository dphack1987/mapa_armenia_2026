"""Optimiza imágenes pesadas para la web."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def optimize_qr() -> None:
    src = ROOT / "pautas publicitarias" / "qr_mapa_armenia.png"
    dest = ROOT / "assets" / "qr-mapa-armenia-display.jpg"
    dest.parent.mkdir(exist_ok=True)

    if not src.exists():
        print(f"No encontrado: {src}")
        return

    img = Image.open(src).convert("RGB")
    max_w = 900
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)), Image.Resampling.LANCZOS)

    img.save(dest, "JPEG", quality=88, optimize=True)
    print(f"QR web: {dest.name} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    optimize_qr()
