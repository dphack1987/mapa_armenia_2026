#!/usr/bin/env python3
"""
Simple script to POST a minimal payload to the Worker URL and print the response.

Usage:
  python scripts/test_worker_request.py https://your-worker-url.workers.dev

If no URL is provided the script will print instructions.
"""
import sys
import json
import urllib.request


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_worker_request.py <WORKER_URL>")
        return
    url = sys.argv[1]
    payload = {
        "text": "Prueba: dame 2 recomendaciones turísticas cortas en Armenia Quindío."
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("Status:", r.status)
            print(r.read().decode("utf-8"))
    except Exception as e:
        print("Error calling worker:", e)


if __name__ == "__main__":
    main()
