"""Verifica que todas las imágenes referenciadas existan y sean válidas."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = [
    "logo_armenia.png",
    "pautas publicitarias/anatolia.png",
    "assets/qr-mapa-armenia-display.jpg",
]

OPTIONAL = [
    "pautas publicitarias/qr_mapa_armenia.png",
    "assets/qr-mapa-armenia-2026.png",
    "decoraciones/2151973988.jpg",
    "decoraciones/9081966_4092826.jpg",
]


def check(path: Path) -> dict:
    if not path.exists():
        return {"path": str(path.relative_to(ROOT)), "ok": False, "error": "no existe"}
    try:
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            return {
                "path": str(path.relative_to(ROOT)),
                "ok": True,
                "format": img.format,
                "size": img.size,
                "bytes": path.stat().st_size,
            }
    except Exception as exc:
        return {"path": str(path.relative_to(ROOT)), "ok": False, "error": str(exc)}


def main() -> int:
    results = [check(ROOT / p) for p in REQUIRED + OPTIONAL]
    failed = [r for r in results if not r["ok"]]

    for r in results:
        status = "OK" if r["ok"] else "FAIL"
        extra = f" {r.get('size')} {r.get('format')}" if r["ok"] else f" — {r.get('error')}"
        print(f"[{status}] {r['path']}{extra}")

    if any(r["path"] == "logo_armenia.png" and not r["ok"] for r in results):
        print("\nSugerencia: python scripts/remove_logo_bg.py")
    if any(r["path"] == "assets/qr-mapa-armenia-display.jpg" and not r["ok"] for r in results):
        print("\nSugerencia: python scripts/optimize_assets.py")

    return 1 if failed and any(p in r["path"] for r in failed for p in REQUIRED) else 0


if __name__ == "__main__":
    raise SystemExit(main())
