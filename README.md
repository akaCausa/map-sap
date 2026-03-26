# MVP — Mapa interactivo de uso de suelo silvoagropecuario por región

Este prototipo muestra un mapa interactivo de Chile con regiones simplificadas para fines de exploración temprana.

## Estructura de archivos

```text
chile_mvp/
├── index.html
├── styles.css
├── app.js
└── data/
    ├── regions.geojson
    └── agri-data.json
```

## Cómo ejecutarlo

### Opción rápida
1. Descarga la carpeta completa.
2. Ábrela en VS Code.
3. Usa una extensión como **Live Server**.
4. Ejecuta `index.html` desde un servidor local.

### Opción con Python
Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego abre en el navegador:

```text
http://localhost:8000
```

> Nota: como el proyecto usa `fetch()` para cargar JSON, no conviene abrir `index.html` directamente con doble clic (`file://`). Mejor usar un servidor local liviano.

## Qué incluye
- Mapa interactivo con regiones clickeables/hoverables.
- Filtro por rubro.
- Tooltip y popup con nombre de región y superficie.
- Escala visual de intensidad.
- Botón de geolocalización del usuario.
- Diseño responsive.

## Qué puedes mejorar en la siguiente iteración
- Reemplazar el GeoJSON simplificado por uno oficial de regiones.
- Conectar datos reales por rubro y año.
- Agregar selector temporal o comparación entre rubros.
- Incorporar accesibilidad adicional para navegación por teclado.
