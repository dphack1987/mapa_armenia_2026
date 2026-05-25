"""Quita fondo blanco de los logos y guarda PNG con transparencia."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WHITE_THRESHOLD = 248
SOFT_EDGE = 12


def remove_white_background(src: Path, dest: Path) -> None:
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            brightness = (r + g + b) / 3
            if brightness >= WHITE_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
            elif brightness >= WHITE_THRESHOLD - SOFT_EDGE:
                fade = int(
                    255 * (WHITE_THRESHOLD - brightness) / SOFT_EDGE
                )
                pixels[x, y] = (r, g, b, min(a, fade))

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(dest, "PNG", optimize=True)
    print(f"OK {dest.name} -> {img.size[0]}x{img.size[1]}")


def main() -> None:
    pairs = [
        ("logo_armenia.jpg", "logo_armenia.png"),
    ]
    for src_name, dest_name in pairs:
        src = ROOT / src_name
        if not src.exists():
            print(f"skip (missing): {src_name}")
            continue
        remove_white_background(src, ROOT / dest_name)


if __name__ == "__main__":
    main()
