"""
Despliega don-chucho-proxy en Cloudflare y configura GEMINI_KEY.

Requiere variables de entorno (o archivo .env en la raíz del repo):
  CF_ACCOUNT_ID, CF_API_TOKEN, GEMINI_KEY
Opcional: GEMINI_MODEL, WORKER_NAME
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER_FILE = ROOT / "worker" / "don-chucho-proxy.js"
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


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"Falta {name}. Copia .env.example a .env y completa los valores.", file=sys.stderr)
        sys.exit(1)
    return value


def cf_request(method: str, path: str, data: dict | None = None, token: str = "") -> tuple[dict, int]:
    url = f"https://api.cloudflare.com/client/v4{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode()), e.code


def deploy_worker(account_id: str, worker_name: str, token: str) -> None:
    print("1. Desplegando Worker script...")
    script = WORKER_FILE.read_text(encoding="utf-8")
    boundary = "----WorkerBoundary"
    metadata = json.dumps({
        "main_module": "don-chucho-proxy.js",
        "compatibility_date": "2024-01-01",
    })
    body_parts = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="metadata"\r\n'
        f"Content-Type: application/json\r\n\r\n"
        f"{metadata}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="don-chucho-proxy.js"; filename="don-chucho-proxy.js"\r\n'
        f"Content-Type: application/javascript+module\r\n\r\n"
        f"{script}\r\n"
        f"--{boundary}--\r\n"
    ).encode()

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}"
    req = urllib.request.Request(
        url,
        data=body_parts,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print("Error HTTP al desplegar:", e.code, e.read().decode()[:400], file=sys.stderr)
        sys.exit(1)

    if not result.get("success"):
        print("Error Cloudflare:", result.get("errors"), file=sys.stderr)
        sys.exit(1)
    print("   OK Worker desplegado")


def set_secret(account_id: str, worker_name: str, token: str, gemini_key: str) -> None:
    print("2. Configurando secret GEMINI_KEY...")
    result, _ = cf_request(
        "PUT",
        f"/accounts/{account_id}/workers/scripts/{worker_name}/secrets",
        {"name": "GEMINI_KEY", "text": gemini_key},
        token,
    )
    if not result.get("success"):
        print("Error configurando secret:", result.get("errors"), file=sys.stderr)
        sys.exit(1)
    print("   OK Secret GEMINI_KEY")


def print_worker_url(account_id: str, worker_name: str, token: str) -> None:
    print("3. URL del Worker:")
    result, _ = cf_request("GET", f"/accounts/{account_id}/workers/subdomain", token=token)
    subdomain = result.get("result", {}).get("subdomain", "")
    if subdomain:
        print(f"   https://{worker_name}.{subdomain}.workers.dev")
    else:
        print(f"   https://{worker_name}.<tu-subdominio>.workers.dev")


def main() -> None:
    load_dotenv()
    account_id = require_env("CF_ACCOUNT_ID")
    token = require_env("CF_API_TOKEN")
    gemini_key = require_env("GEMINI_KEY")
    worker_name = os.environ.get("WORKER_NAME", "don-chucho-proxy").strip()

    if not WORKER_FILE.is_file():
        print(f"No existe {WORKER_FILE}", file=sys.stderr)
        sys.exit(1)

    deploy_worker(account_id, worker_name, token)
    set_secret(account_id, worker_name, token, gemini_key)
    print_worker_url(account_id, worker_name, token)
    print("\nListo. Verifica WORKER_URL en js/don-chucho.js")


if __name__ == "__main__":
    main()
