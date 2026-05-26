# Conectar Don Chucho a tu cuenta Gemini (gratis)

Don Chucho usa la **API de Google AI Studio** (misma tecnología que Gemini). No inicia sesión con tu cuenta de Gmail en el navegador: usa una **API key** ligada a tu proyecto.

## Paso 1 — Crear la API key (gratis)

1. Entra a [Google AI Studio](https://aistudio.google.com/apikey) con tu cuenta Google.
2. Clic en **Create API key** → elige un proyecto (o crea uno).
3. Copia la clave (empieza por `AIza...`).

Plan gratuito (2026): límites por minuto/día según el modelo. Recomendado: **`gemini-2.5-flash`** o **`gemini-2.0-flash-lite`**.

## Paso 2 — Configurar el mapa (local o GitHub Pages)

Copia el ejemplo y pega tu clave:

```text
copy config\don-chucho-config.example.js config\don-chucho-config.js
```

Edita `config/don-chucho-config.js`:

```javascript
window.DON_CHUCHO_CONFIG = {
  GEMINI_KEY: "TU_CLAVE_AQUI",
  GEMINI_MODEL: "gemini-2.5-flash",
  WORKER_URL: "https://don-chucho-proxy.parraprietodavid87.workers.dev",
};
```

> No subas la clave a repos públicos. Para producción segura, usa solo el Worker (paso 3).

## Paso 3 — Worker Cloudflare (recomendado en producción)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers → `don-chucho-proxy`.
2. **Settings → Secrets** → `GEMINI_KEY` = tu clave nueva.
3. **Variables** → `GEMINI_MODEL` = `gemini-2.5-flash`.
4. **Quick edit** → pega `worker/don-chucho-proxy.js` → Guardar.

El mapa llama al Worker; la clave nunca va en el HTML.

## Si se queda sin respuestas

| Causa | Qué hacer |
|--------|-----------|
| Cuota diaria (429) | Esperar o cambiar modelo; usar chips del mapa (sin IA) |
| Clave filtrada (403) | Crear clave nueva en AI Studio |
| Modelo sin cuota | Usar `gemini-2.5-flash` en Worker y en config |

## Rotar clave si se filtró

1. AI Studio → eliminar clave vieja → crear una nueva.
2. Actualizar `GEMINI_KEY` en Worker y/o `don-chucho-config.js`.
