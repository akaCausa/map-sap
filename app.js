const map = L.map('map').setView([-35, -71], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let geoLayer;
let dataStore;
let selectedFilter = "todos";

// escala de color simple
function getColor(value) {
  return value > 50000 ? "#1b5e20" :
         value > 20000 ? "#2e7d32" :
         value > 10000 ? "#66bb6a" :
         "#c8e6c9";
}

// obtener valor según filtro
function getValue(regionName) {
  const region = dataStore.find(r => r.name === regionName);
  if (!region) return 0;

  if (selectedFilter === "todos") {
    return region.usos.reduce((sum, u) => sum + u.hectareas, 0);
  }

  const uso = region.usos.find(u => u.rubro === selectedFilter);
  return uso ? uso.hectareas : 0;
}

// estilo dinámico
function style(feature) {
  const val = getValue(feature.properties.name);
  return {
    fillColor: getColor(val),
    weight: 1,
    color: "#555",
    fillOpacity: 0.7
  };
}

// panel lateral
function showPanel(regionName) {
  const region = dataStore.find(r => r.name === regionName);
  const panel = document.getElementById("panel");
  const content = document.getElementById("panel-content");

  if (!region) return;

  let html = `<div class="region-title">${region.name}</div>`;

  region.usos.forEach(u => {
    html += `
      <div class="rubro">
        <strong>${u.rubro}</strong>
        ${u.hectareas.toLocaleString()} ha
        <div class="small">${u.porcentaje_pais}% del país</div>
      </div>
    `;
  });

  content.innerHTML = html;
  panel.classList.remove("hidden");
}

// interacción
function onEachFeature(feature, layer) {
  layer.on({
    click: () => showPanel(feature.properties.name)
  });
}

// actualizar mapa
function updateMap() {
  geoLayer.setStyle(style);
}

// cargar datos
Promise.all([
  fetch("data/regions.geojson").then(res => res.json()),
  fetch("data/data.json").then(res => res.json())
]).then(([geojson, data]) => {

  dataStore = data.regions;

  geoLayer = L.geoJSON(geojson, {
    style,
    onEachFeature
  }).addTo(map);

});

// filtro
document.getElementById("filter").addEventListener("change", (e) => {
  selectedFilter = e.target.value;
  updateMap();
});
