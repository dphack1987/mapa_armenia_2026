"""Prueba rápida de modelos Gemini (usa GEMINI_KEY de .env o entorno)."""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
if ENV_FILE.is_file():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

key = os.environ.get("GEMINI_KEY", "").strip()
if not key:
    print("Define GEMINI_KEY en el entorno.", file=sys.stderr)
    sys.exit(1)

models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]

for model in models:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={key}"
    )
    body = json.dumps(
        {
            "contents": [{"role": "user", "parts": [{"text": "Di hola en una palabra"}]}],
            "generationConfig": {"maxOutputTokens": 10},
        }
    ).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.loads(r.read())
            text = (
                d.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            print(f"{model}: OK -> {text[:50]!r}")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        msg = err.get("error", {}).get("message", "")[:100]
        print(f"{model}: HTTP {e.code} -> {msg}")
