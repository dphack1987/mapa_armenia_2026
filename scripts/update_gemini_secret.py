"""Actualiza solo el secret GEMINI_KEY del Worker (lee .env)."""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def load_dotenv() -> None:
    if not ENV_FILE.is_file():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> None:
    load_dotenv()
    account_id = os.environ.get("CF_ACCOUNT_ID", "").strip()
    token = os.environ.get("CF_API_TOKEN", "").strip()
    gemini_key = os.environ.get("GEMINI_KEY", "").strip()
    worker_name = os.environ.get("WORKER_NAME", "don-chucho-proxy").strip()

    for name, val in [
        ("CF_ACCOUNT_ID", account_id),
        ("CF_API_TOKEN", token),
        ("GEMINI_KEY", gemini_key),
    ]:
        if not val:
            print(f"Falta {name} en .env", file=sys.stderr)
            sys.exit(1)

    url = (
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}"
        f"/workers/scripts/{worker_name}/secrets"
    )
    body = json.dumps({"name": "GEMINI_KEY", "text": gemini_key}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print("Error:", e.code, e.read().decode()[:500], file=sys.stderr)
        sys.exit(1)

    if result.get("success"):
        print("OK: GEMINI_KEY actualizada en", worker_name)
    else:
        print("Error:", result.get("errors"), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
