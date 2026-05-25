# Mapa digital Armenia 2026

Mapa turístico, comercial y gastronómico de **Armenia, Quindío · Colombia 2026**.

## Contenido

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Mapa interactivo principal |
| `logo_armenia.jpg` | Logo oficial del mapa |
| `logo_anatolia.jpg` | Marca Anatolia |
| `data/pois.json` | Lugares de interés (coordenadas y textos) |
| `css/styles.css` | Estilos (colores del logo: verdes, café, dorado, teal) |
| `js/map.js` | Lógica del mapa (Leaflet + OpenStreetMap) |

## Cómo ver el mapa

Abre la carpeta con un servidor local (necesario para cargar `pois.json`):

```powershell
cd "C:\Users\user\Documents\mapa armenia 2026\mapa digital armenia 2026"
python -m http.server 8080
```

Luego visita: http://localhost:8080

## Agregar o editar lugares

Edita `data/pois.json`. Cada punto necesita:

- `id`: identificador único (sin espacios)
- `name`, `category` (`turistico` | `comercial` | `gastronomico`)
- `lat`, `lng` (coordenadas WGS84)
- `address`, `description` (opcionales pero recomendados)

Puedes obtener coordenadas en [OpenStreetMap](https://www.openstreetmap.org/) (clic derecho → mostrar dirección / copiar coordenadas).

## Relación con el diseño impreso

En la carpeta superior hay archivos CorelDRAW (`.cdr`) de las caras 1 y 2 del mapa impreso. Este proyecto digital es la versión interactiva complementaria; puedes sincronizar los puntos del JSON con los del diseño en Corel.

## Próximos pasos sugeridos

1. Completar `pois.json` con todos los establecimientos del mapa impreso.
2. Añadir logos de patrocinadores si aplica.
3. Exportar capturas o PDF desde el navegador para redes sociales.
4. Publicar en hosting estático (Netlify, GitHub Pages, etc.).
