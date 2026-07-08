#!/usr/bin/env python3
import os
import json
from datetime import datetime

def main():
    # Cargar datos
    with open('data/seo-data.json', 'r', encoding='utf-8') as f:
        seo_data = json.load(f)
    
    with open('data/pois.json', 'r', encoding='utf-8') as f:
        pois_data = json.load(f)
    
    with open('data/pautas.json', 'r', encoding='utf-8') as f:
        pautas_data = json.load(f)
    
    municipios = seo_data['municipios']
    categorias = seo_data['categorias']
    
    # Crear directorio para páginas SEO
    seo_dir = 'seo'
    os.makedirs(seo_dir, exist_ok=True)
    
    urls = []
    
    # Generar todas las combinaciones: municipio + categoría
    for municipio in municipios:
        municipio_slug = municipio.lower().replace(' ', '-')
        municipio_dir = os.path.join(seo_dir, municipio_slug)
        os.makedirs(municipio_dir, exist_ok=True)
        
        for categoria in categorias:
            categoria_id = categoria['id']
            categoria_nombre = categoria['nombre']
            
            # Filtrar POIs relevantes para esta categoría
            pois_filtrados = [
                poi for poi in pois_data['pois']
                if poi['category'] == categoria_id.split('-')[0]  # Simplificado
            ]
            
            # Generar página HTML
            html_content = generate_page_html(
                municipio=municipio,
                categoria=categoria,
                pois=pois_filtrados,
                pautas=pautas_data['pautas']
            )
            
            # Guardar página
            page_path = os.path.join(municipio_dir, f'{categoria_id}.html')
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Agregar URL al sitemap
            url = f'https://mapa-armenia-2026.vercel.app/seo/{municipio_slug}/{categoria_id}.html'
            urls.append(url)
            print(f'Generado: {url}')
    
    # Generar sitemap.xml
    generate_sitemap(urls)
    print(f'\n✅ Generadas {len(urls)} páginas SEO y sitemap.xml')

def generate_page_html(municipio, categoria, pois, pautas):
    """Genera el HTML para una página SEO"""
    title = f'{categoria["nombre"]} en {municipio}, Quindío - Mapa Turístico'
    description = f'Mapa interactivo y directorio de {categoria["nombre"].lower()} en {municipio}. Encuentra los mejores lugares para visitar en el Quindío.'
    keywords = ', '.join(categoria['keywords'])
    
    # Schema.org - ItemList
    schema_items = []
    for i, poi in enumerate(pois[:10], 1):
        schema_items.append({
            "@type": "ListItem",
            "position": i,
            "name": poi['name'],
            "url": f"https://mapa-armenia-2026.vercel.app/index.html?poi={poi['id']}"
        })
    
    schema = {
        "@context": "https://schema.org",
        "@type": "ItemPage",
        "name": title,
        "description": description,
        "mainEntity": {
            "@type": "ItemList",
            "name": f'Los mejores {categoria["nombre"].lower()} en {municipio}, Quindío',
            "description": description,
            "itemListElement": schema_items
        }
    }
    
    # HTML
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <meta name="keywords" content="{keywords}">
    <link rel="canonical" href="https://mapa-armenia-2026.vercel.app/">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mapa-armenia-2026.vercel.app/">
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    {json.dumps(schema, ensure_ascii=False, indent=2)}
    </script>
    
    <link rel="stylesheet" href="../css/styles.css">
    <style>
        .seo-container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }}
        .hero {{
            text-align: center;
            padding: 3rem 1rem;
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-radius: 12px;
            margin-bottom: 2rem;
        }}
        .hero h1 {{
            color: #1b5e20;
            margin-bottom: 1rem;
        }}
        .pois-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }}
        .poi-card {{
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .poi-card h3 {{
            color: #2e7d32;
            margin-bottom: 0.5rem;
        }}
        .btn-volver {{
            display: inline-block;
            background: #2e7d32;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 2rem;
        }}
        .btn-volver:hover {{
            background: #1b5e20;
        }}
    </style>
</head>
<body>
    <div class="seo-container">
        <div class="hero">
            <h1>{categoria['nombre']} en {municipio}</h1>
            <p>Explora los mejores {categoria['nombre'].lower()} del Quindío</p>
        </div>
        
        <h2>Lugares Destacados</h2>
        <div class="pois-grid">
            {''.join([f'''
            <div class="poi-card">
                <h3>{poi['name']}</h3>
                <p>{poi['description']}</p>
                <p><small>{poi['address']}</small></p>
            </div>
            ''' for poi in pois[:6]])}
        </div>
        
        <center>
            <a href="../index.html" class="btn-volver">← Volver al Mapa Principal</a>
        </center>
    </div>
</body>
</html>'''

def generate_sitemap(urls):
    """Genera sitemap.xml"""
    today = datetime.now().strftime('%Y-%m-%d')
    sitemap_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
'''
    
    # Agregar página principal
    sitemap_xml += f'''
    <url>
        <loc>https://mapa-armenia-2026.vercel.app/</loc>
        <lastmod>{today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
'''
    
    # Agregar páginas SEO
    for url in urls:
        sitemap_xml += f'''
    <url>
        <loc>{url}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
'''
    
    sitemap_xml += '''
</urlset>'''
    
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)

if __name__ == '__main__':
    main()
