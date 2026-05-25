# Mapa digital Armenia 2026

Mapa turístico, comercial y gastronómico de **Armenia, Quindío · Colombia 2026**.

## Contenido

| Archivo / carpeta | Descripción |
|-------------------|-------------|
| `index.html` | Mapa interactivo |
| `compartir.html` | Página con código QR para compartir |
| `logo_armenia.png` | Logo del mapa (sin fondo blanco) |
| `pautas publicitarias/` | Pautas y QR diseñado (`qr_mapa_armenia.png`) |
| `decoraciones/` | Fondos y marcos para la interfaz |
| `data/decoraciones.json` | Fondos (jpg) y acentos (colibrí, mariposas) por zona |
| `assets/qr-mapa-armenia-display.jpg` | QR optimizado para web |
| `data/pois.json` | Lugares en el mapa |
| `data/pautas.json` | Pautas vinculadas a puntos (`poiId`) |
| `data/site.json` | URL pública para el QR |
| `js/map.js` | Lógica del mapa (Leaflet) |

**Nota:** No se usa el logo tipográfico de Anatolia en la interfaz; solo la **pauta** en `pautas publicitarias/anatolia.png`.

## Ver en local

```powershell
cd "C:\Users\user\Documents\mapa armenia 2026\mapa digital armenia 2026"
python -m http.server 8080
```

- Mapa: http://localhost:8080  
- QR: http://localhost:8080/compartir.html  

## Compartir (QR)

1. Edita `data/site.json` → `shareUrl` (producción: `https://mapa-armenia-2026.vercel.app/`).
2. El QR en `compartir.html` y `assets/qr-mapa-armenia-2026.png` usan esa URL.

Optimizar QR y assets pesados:

```powershell
python scripts/optimize_assets.py
```

Generar QR simple (alternativo):

```powershell
pip install qrcode[pil]
python scripts/generate_qr.py
```

## Verificar imágenes

```powershell
python scripts/verify_images.py
```

## Nueva pauta publicitaria

1. Guarda el PNG en `pautas publicitarias/nombre.png`.
2. Añade entrada en `data/pautas.json` con `ficha` (descripción, servicios), `whatsapp`, `whatsappMensaje`, `poiId`, etc.
3. Añade el punto en `data/pois.json` con `"pautaId": "..."` vinculado a la pauta.

Al hacer clic en la pauta se abre la **ficha informativa** con botón **WhatsApp** para contacto directo turista ↔ empresario.

## Repositorio

https://github.com/dphack1987/mapa_armenia_2026
