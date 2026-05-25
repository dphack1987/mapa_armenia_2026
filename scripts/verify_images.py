"""Verifica que todas las imágenes referenciadas existan y sean válidas."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

REQUIRED = [
    "logo_armenia.png",
    "pautas publicitarias/anatolia.png",
    "assets/qr-mapa-armenia-display.jpg",
]


def paths_from_decoraciones() -> list[str]:
    p = ROOT / "data" / "decoraciones.json"
    if not p.exists():
        return []
    data = json.loads(p.read_text(encoding="utf-8"))
    out = []
    for capa in data.get("capas", []):
        if capa.get("archivo"):
            out.append(capa["archivo"])
    for a in data.get("acentos", []):
        if a.get("archivo"):
            out.append(a["archivo"])
    c = data.get("compartir", {})
    if c.get("fondo"):
        out.append(c["fondo"])
    f = data.get("ficha", {})
    if f.get("fondo"):
        out.append(f["fondo"])
    if f.get("acento"):
        out.append(f["acento"])
    if data.get("qr", {}).get("imagen"):
        out.append(data["qr"]["imagen"])
    return list(dict.fromkeys(out))


def check(path: Path) -> dict:
    rel = str(path.relative_to(ROOT))
    if not path.exists():
        return {"path": rel, "ok": False, "error": "no existe"}
    try:
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            return {
                "path": rel,
                "ok": True,
                "format": img.format,
                "size": img.size,
                "bytes": path.stat().st_size,
            }
    except Exception as exc:
        return {"path": rel, "ok": False, "error": str(exc)}


def main() -> int:
    all_paths = REQUIRED + paths_from_decoraciones()
    results = [check(ROOT / p) for p in all_paths]
    failed = [r for r in results if not r["ok"]]

    for r in results:
        status = "OK" if r["ok"] else "FAIL"
        extra = f" {r.get('size')} {r.get('format')}" if r["ok"] else f" — {r.get('error')}"
        print(f"[{status}] {r['path']}{extra}")

    if failed:
        print(f"\n{len(failed)} archivo(s) con problema.")
    else:
        print(f"\n{len(results)} imagenes OK.")

    return 1 if any(r["path"] in REQUIRED and not r["ok"] for r in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
