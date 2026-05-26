# Don Chucho — Proxy Cloudflare Worker

La clave de Gemini **no** va en `js/don-chucho.js`. Solo en el secret `GEMINI_KEY` del Worker.

## Si la clave anterior se filtró

1. Crea una **clave nueva** en [Google AI Studio](https://aistudio.google.com/apikey).
2. En Cloudflare → Workers → `don-chucho-proxy` → Settings → Variables → Secrets → edita `GEMINI_KEY`.
3. (Opcional) Añade variable de texto `GEMINI_MODEL` = `gemini-2.5-flash` (recomendado; `gemini-2.0-flash-lite` suele quedar sin cuota en plan gratis).

## Desplegar desde tu PC

```bash
copy .env.example .env
# Edita .env con CF_API_TOKEN y GEMINI_KEY nuevos

python scripts/deploy_worker.py
```

El script sube `worker/don-chucho-proxy.js` y configura el secret.

## Desplegar manualmente (sin script)

1. Cloudflare Dashboard → Workers → `don-chucho-proxy` → Quick edit.
2. Pega el contenido de `worker/don-chucho-proxy.js`.
3. Guarda y configura el secret `GEMINI_KEY`.

URL del Worker (ya usada en el mapa):

`https://don-chucho-proxy.parraprietodavid87.workers.dev`
