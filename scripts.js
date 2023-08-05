let map;
let drawing;
var mymap = L.map(document.getElementById("map"));

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { DrawingManager } = await google.maps.importLibrary("drawing");

  //   map = new Map(document.getElementById("map"), {
  //     center: { lat: 33.71570658503559, lng: -116.28775752362638 },
  //     zoom: 12,
  //   });

  //   mymap = L.map(document.getElementById("map"), {
  //     center: [51.505, -0.09],
  //     zoom: 13,
  //   });

  setMyMap(51.505, -0.09);
}

function setMyMap(lat, lng) {
  mymap.setView([lat, lng], 20);

  var roads = L.gridLayer
    .googleMutant({
      type: "satellite", // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
    })
    .addTo(mymap);
}

initMap();
