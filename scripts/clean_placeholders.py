#!/usr/bin/env python3
"""
Backup and clean placeholder values from data/pois.json.

This script copies `data/pois.json` to `data/backups/pois.json.YYYYMMDD_HHMMSS.bak`
and writes a cleaned file where common placeholders like
"[Teléfono pendiente]" or "[Descripción pendiente]" are replaced with
empty strings and a `needsReview: true` flag is added to the POI.
"""
from pathlib import Path
from datetime import datetime
import json

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
POIS = DATA_DIR / "pois.json"
BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)


def is_placeholder(val):
    if not val or not isinstance(val, str):
        return False
    v = val.strip().lower()
    return "pendiente" in v or v.startswith("[") and v.endswith("]")


def main():
    if not POIS.exists():
        print("pois.json not found")
        return

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = BACKUP_DIR / f"pois.json.{ts}.bak"
    POIS.replace(backup)
    print(f"Backed up original to {backup}")

    # Read backup and clean
    data = json.loads(backup.read_text(encoding="utf-8"))
    changed = 0
    for p in data.get("pois", []):
        review = False
        for k in ("description", "address", "telefono", "horario"):
            v = p.get(k)
            if is_placeholder(v):
                p[k] = ""
                review = True
        if review:
            p["needsReview"] = True
            changed += 1

    POIS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote cleaned pois.json (modified {changed} entries)")


if __name__ == "__main__":
    main()
