import urllib.parse, urllib.request, json
addresses = [
    'Carrera 14 # 14-14 Armenia Quindio Colombia',
    'Carrera 14 # 20-50 Armenia Quindio Colombia',
    'Carrera 13 # 19-30 Armenia Quindio Colombia',
    'Calle 50 Containers de los Naranjos local 10 Armenia Colombia',
    'Calle 17N # 10-30 Barrio El Nogal Armenia Quindio Colombia',
    'Carrera 18 # 59-37 Armenia Quindio Colombia',
    'Antiguo Estadio San Jose Armenia Quindio Colombia',
    'Avenida Bolivar 21 Norte 47 Armenia Quindio Colombia',
    'Calle 17 # 13-50 Armenia Quindio Colombia',
    'Sagrada Familia Armenia Quindio Colombia',
    'Calle 22 Norte Carrera 14-28 Torre Ele Armenia Quindio Colombia',
    'Parque Fundadores Armenia Quindio Colombia',
    'Plaza de Bolivar Armenia Quindio Colombia',
    'Parque Sucre Armenia Quindio Colombia',
    'Calle 22 Norte 14-40 Edificio Zona-L Armenia Quindio Colombia'
]
for a in addresses:
    url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+urllib.parse.quote(a)
    req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        data=json.load(r)
    print(a, '=>', data[0]['lat'], data[0]['lon'])
