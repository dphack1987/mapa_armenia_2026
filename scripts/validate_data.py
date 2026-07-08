#!/usr/bin/env python3
"""
Validate data/ JSON files and produce reports/data-audit.md

Usage: python scripts/validate_data.py
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERROR reading {path}: {e}")
        return None


def is_placeholder(s):
    if not s or not isinstance(s, str):
        return False
    s2 = s.lower()
    return "pendiente" in s2 or s2.strip().startswith("[") and "pendiente" in s2


def main():
    pois_path = DATA_DIR / "pois.json"
    pautas_path = DATA_DIR / "pautas.json"

    pois_data = load_json(pois_path)
    pautas_data = load_json(pautas_path)
    if pois_data is None:
        print("Missing or invalid pois.json")
        sys.exit(1)

    meta = pois_data.get("meta", {})
    center = meta.get("center", [0, 0])
    lat0, lng0 = center[0], center[1]
    delta = 0.06
    lat_min, lat_max = lat0 - delta, lat0 + delta
    lng_min, lng_max = lng0 - delta, lng0 + delta

    pois = pois_data.get("pois", [])

    missing_fields = []
    out_of_bounds = []
    placeholders = []

    ids = set()
    for p in pois:
        pid = p.get("id")
        if not pid:
            missing_fields.append((p, "missing id"))
            continue
        ids.add(pid)
        if not p.get("name"):
            missing_fields.append((pid, "missing name"))

        lat = p.get("lat")
        lng = p.get("lng")
        if lat is None or lng is None:
            missing_fields.append((pid, "missing lat/lng"))
        else:
            try:
                latf = float(lat)
                lngf = float(lng)
                if not (lat_min <= latf <= lat_max and lng_min <= lngf <= lng_max):
                    out_of_bounds.append((pid, latf, lngf))
            except Exception:
                missing_fields.append((pid, "invalid lat/lng"))

        for key in ("description", "address", "telefono", "horario"):
            if is_placeholder(p.get(key)):
                placeholders.append((pid, key, p.get(key)))

    pauta_issues = []
    pautas = []
    if pautas_data:
        pautas = pautas_data.get("pautas", [])
        for pa in pautas:
            pid = pa.get("poiId")
            if pid and pid not in ids:
                pauta_issues.append((pa.get("id") or pa.get("nombre"), pid))

    # Write report
    report_path = REPORTS_DIR / "data-audit.md"
    with report_path.open("w", encoding="utf-8") as f:
        f.write("# Data audit report\n\n")
        f.write(f"Meta center: {center} (lat range {lat_min}..{lat_max}, lng range {lng_min}..{lng_max})\n\n")
        f.write(f"Total POIs: {len(pois)}\n")
        f.write(f"Total Pautas: {len(pautas)}\n\n")

        f.write("## Missing / invalid fields\n\n")
        if missing_fields:
            for item in missing_fields:
                f.write(f"- {item}\n")
        else:
            f.write("- None\n")

        f.write("\n## POIs outside bounding box\n\n")
        if out_of_bounds:
            for pid, latf, lngf in out_of_bounds:
                f.write(f"- {pid}: {latf}, {lngf}\n")
        else:
            f.write("- None\n")

        f.write("\n## Placeholder fields detected\n\n")
        if placeholders:
            for pid, key, val in placeholders:
                f.write(f"- {pid} -> {key}: {val}\n")
        else:
            f.write("- None\n")

        f.write("\n## Pautas referencing missing POIs\n\n")
        if pauta_issues:
            for pidname, poi in pauta_issues:
                f.write(f"- Pauta {pidname} references missing poiId: {poi}\n")
        else:
            f.write("- None\n")

    print(f"Report written to {report_path}")


if __name__ == "__main__":
    main()
