const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: true,
  tap: true,
  worldCopyJump: false,
  maxBoundsViscosity: 0.8
});

const DEFAULT_VIEW = {
  center: [-35.7, -71.0],
  zoom: window.innerWidth < 640 ? 4 : 5
};

map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 18
}).addTo(map);

let geoJsonLayer;
let geoData;
let statsData;
let currentRubro = 'agricola';
let currentSelectedLayer = null;
let userMarker = null;

const rubroLabels = {
  agricola: 'Agrícola',
  forestal: 'Forestal',
  ganadero: 'Ganadero',
  fruticola: 'Frutícola'
};

const rubroSelect = document.getElementById('rubroSelect');
const activeCategory = document.getElementById('activeCategory');
const activeRegion = document.getElementById('activeRegion');
const activeValue = document.getElementById('activeValue');
const legendMin = document.getElementById('legendMin');
const legendMax = document.getElementById('legendMax');
const locateBtn = document.getElementById('locateBtn');
const resetViewBtn = document.getElementById('resetViewBtn');

const formatHectares = (value) => `${new Intl.NumberFormat('es-CL').format(value)} ha`;

function getRegionValue(regionName, rubro) {
  return statsData?.[regionName]?.[rubro] ?? 0;
}

function getScaleStops(values) {
  const max = Math.max(...values);
  return {
    min: 0,
    max,
    q1: max * 0.2,
    q2: max * 0.4,
    q3: max * 0.6,
    q4: max * 0.8
  };
}

function getColor(value, scale) {
  if (value <= 0) return '#edf5ee';
  if (value <= scale.q1) return '#d7eadb';
  if (value <= scale.q2) return '#b8d8bf';
  if (value <= scale.q3) return '#7fb28b';
  if (value <= scale.q4) return '#3f7f57';
  return '#1f4e35';
}

function baseStyle(feature, scale) {
  const value = getRegionValue(feature.properties.name, currentRubro);
  return {
    fillColor: getColor(value, scale),
    weight: 1.2,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: 0.9,
    className: 'region-shape'
  };
}

function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 2,
    color: '#173124',
    fillOpacity: 1
  });
  layer.bringToFront();
}

function resetHighlight(e) {
  if (currentSelectedLayer && e.target === currentSelectedLayer) return;
  geoJsonLayer.resetStyle(e.target);
}

function updateSummary(regionName = 'Ninguna', value = null) {
  activeCategory.textContent = rubroLabels[currentRubro];
  activeRegion.textContent = regionName;
  activeValue.textContent = value === null ? '—' : formatHectares(value);
}

function buildTooltip(regionName) {
  const value = getRegionValue(regionName, currentRubro);
  return `
    <div class="region-tooltip">
      <strong>${regionName}</strong>
      <span>Rubro: ${rubroLabels[currentRubro]}</span><br>
      <span class="value">${formatHectares(value)}</span>
    </div>
  `;
}

function selectRegion(layer, feature) {
  if (currentSelectedLayer && currentSelectedLayer !== layer) {
    geoJsonLayer.resetStyle(currentSelectedLayer);
  }
  currentSelectedLayer = layer;
  highlightFeature({ target: layer });
  const value = getRegionValue(feature.properties.name, currentRubro);
  updateSummary(feature.properties.name, value);
  layer.openPopup();
}

function onEachFeature(feature, layer) {
  const regionName = feature.properties.name;
  layer.bindTooltip(buildTooltip(regionName), { sticky: true, direction: 'top' });
  layer.bindPopup(buildTooltip(regionName), { closeButton: false, autoPan: true });

  layer.on({
    mouseover: (e) => {
      highlightFeature(e);
      updateSummary(regionName, getRegionValue(regionName, currentRubro));
    },
    mouseout: (e) => {
      resetHighlight(e);
      if (!currentSelectedLayer) updateSummary();
    },
    click: () => selectRegion(layer, feature)
  });
}

function renderMap() {
  const values = geoData.features.map((feature) => getRegionValue(feature.properties.name, currentRubro));
  const scale = getScaleStops(values);

  legendMin.textContent = formatHectares(scale.min);
  legendMax.textContent = formatHectares(scale.max);

  if (geoJsonLayer) {
    geoJsonLayer.remove();
  }

  geoJsonLayer = L.geoJSON(geoData, {
    style: (feature) => baseStyle(feature, scale),
    onEachFeature
  }).addTo(map);

  geoJsonLayer.eachLayer((layer) => {
    const regionName = layer.feature.properties.name;
    layer.setPopupContent(buildTooltip(regionName));
    layer.setTooltipContent(buildTooltip(regionName));
  });

  map.fitBounds(geoJsonLayer.getBounds(), {
    padding: window.innerWidth < 640 ? [10, 10] : [24, 24]
  });

  if (currentSelectedLayer) {
    const selectedName = currentSelectedLayer.feature.properties.name;
    currentSelectedLayer = null;
    geoJsonLayer.eachLayer((layer) => {
      if (layer.feature.properties.name === selectedName) {
        selectRegion(layer, layer.feature);
      }
    });
  } else {
    updateSummary();
  }
}

async function init() {
  try {
    const [geoResponse, dataResponse] = await Promise.all([
      fetch('./data/regions.geojson'),
      fetch('./data/agri-data.json')
    ]);

    geoData = await geoResponse.json();
    statsData = await dataResponse.json();

    renderMap();
  } catch (error) {
    console.error('Error cargando el MVP:', error);
    alert('No fue posible cargar los datos del mapa. Revisa que los archivos estén en la estructura correcta.');
  }
}

rubroSelect.addEventListener('change', (event) => {
  currentRubro = event.target.value;
  renderMap();
});

resetViewBtn.addEventListener('click', () => {
  currentSelectedLayer = null;
  renderMap();
});

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización.');
    return;
  }

  locateBtn.disabled = true;
  locateBtn.textContent = 'Buscando ubicación...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      if (userMarker) userMarker.remove();

      const locationIcon = L.divIcon({
        className: '',
        html: '<div class="user-location-pin"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      userMarker = L.marker([latitude, longitude], { icon: locationIcon })
        .addTo(map)
        .bindPopup('Tu ubicación aproximada')
        .openPopup();

      map.flyTo([latitude, longitude], 6, { duration: 1.2 });
      locateBtn.disabled = false;
      locateBtn.textContent = 'Usar mi ubicación';
    },
    (error) => {
      console.warn(error);
      alert('No fue posible obtener tu ubicación. Revisa los permisos del navegador.');
      locateBtn.disabled = false;
      locateBtn.textContent = 'Usar mi ubicación';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

map.on('click', (e) => {
  if (e.originalEvent.target.closest('.leaflet-interactive')) return;
  currentSelectedLayer = null;
  updateSummary();
  if (geoJsonLayer) geoJsonLayer.eachLayer((layer) => geoJsonLayer.resetStyle(layer));
});

init();
