const GOOGLE_KEY = "AIzaSyD2Scwhz4E2TQpRNarBvSAYWnos-lw0hRs";
const NRELKEY = "LomNWWBzpBjdlzoYBWwgYV008enn5lo9d7MeetaJ";
const URL_BASE = "https://maps.googleapis.com/maps/api/geocode/";

const form = document.getElementById("addressForm");
const slider = document.getElementById("rotateRange");
const rect = document.querySelector("rect");
const radioGroup = document.getElementById("nswe");
const addRemovePanel = document.getElementById("addRemovePanelButton");
let nswePanel = document.querySelector('input[name="direction"]:checked').value;
let rotationAngle = 0;
let coordinates = [];
let chart;
let toggleAddRemove = true;

// Center point coordinates
const cx = rect.getAttribute("x") + rect.getAttribute("width") / 2;
const cy = rect.getAttribute("y") + rect.getAttribute("height") / 2;

var mymap = L.map("mapid", {
  center: [51.505, -0.09],
  zoom: 20,
});
let layers = [];
let solarArrayMap = [];
let systemArrayPanel = [];
let samsungPanel = {
  panel_height: 1.644,
  panel_width: 0.992,
  heightOffset: 0.00001825 / 2,
  widthOffset: 0.00000894 / 2,
  //kilowatt
  watt: 0.25,
};

slider.addEventListener("input", (event) => {
  rect.setAttribute("transform", `rotate(${event.target.value - 180} 60 60)`);
  rotationAngle = event.target.value - 180;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  let urlParams =
    encodeURI("json?address=" + formData.get("address")).replaceAll(
      "%20",
      "+"
    ) + `&key=${GOOGLE_KEY}`;

  const request = new Request(URL_BASE + urlParams);

  fetch(request)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on api server!");
      }
    })
    .then((response) => {
      lat = response["results"][0]["geometry"]["location"]["lat"];
      lng = response["results"][0]["geometry"]["location"]["lng"];
      setMyMap(lat, lng);
    })
    .catch((error) => {
      console.error(error);
    });
});

radioGroup.addEventListener("change", function () {
  nswePanel = document.querySelector('input[name="direction"]:checked').value;
});

addRemovePanel.addEventListener("click", () => {
  if (toggleAddRemove) {
    addRemovePanel.textContent = "Removing";
  } else {
    addRemovePanel.textContent = "Click to Remove";
  }
  toggleAddRemove = !toggleAddRemove;
});

mymap.on("click", function (e) {
  if (toggleAddRemove) {
    let coord = [e.latlng["lat"], e.latlng["lng"]];
    let bounds = panelLatLng(coord);
    let polygon = L.polygon(bounds, { color: "blue", weight: 1 });

    solarArrayMap.push(polygon);
    systemArrayPanel.push({
      polygon,
      angle: rotationAngle,
      azimuth: nswePanel,
      panel: samsungPanel,
    });

    systemArrayPanel.at(-1).polygon.addTo(mymap);

    systemArrayPanel.at(-1).polygon.addEventListener("click", (e) => {
      if (!toggleAddRemove) {
        let index = findIndex(e.target);
        systemArrayPanel.at(index).polygon.remove(mymap);
        systemArrayPanel.splice(index, 1);
        PVWatts();
      }
    });
    PVWatts();
  }
});

function findIndex(rect) {
  for (let index = 0; index < systemArrayPanel.length; index++) {
    const element = systemArrayPanel[index].polygon;
    if (rect == element) {
      return index;
    }
  }
  return -1;
}

function panelLatLng(coord) {
  topLeft = [
    coord[0] + samsungPanel.widthOffset,
    coord[1] - samsungPanel.heightOffset,
  ];
  topRight = [
    coord[0] - samsungPanel.widthOffset,
    coord[1] - samsungPanel.heightOffset,
  ];
  bottomRight = [
    coord[0] - samsungPanel.widthOffset,
    coord[1] + samsungPanel.heightOffset,
  ];
  bottomLeft = [
    coord[0] + samsungPanel.widthOffset,
    coord[1] + samsungPanel.heightOffset,
  ];
  let result = rotateRectangle(
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    coord,
    rotationAngle
  );
  return [...result];
}

function rotateRectangle(
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
  center,
  angle
) {
  // Translate points so center aligns with origin
  let x1 = topLeft[0] - center[0];
  let y1 = topLeft[1] - center[1];

  let x2 = topRight[0] - center[0];
  let y2 = topRight[1] - center[1];

  let x3 = bottomRight[0] - center[0];
  let y3 = bottomRight[1] - center[1];

  let x4 = bottomLeft[0] - center[0];
  let y4 = bottomLeft[1] - center[1];

  // Rotate points
  let radAngle = (angle * Math.PI) / 180;

  let x1Rotated = x1 * Math.cos(radAngle) - y1 * Math.sin(radAngle);
  let y1Rotated = x1 * Math.sin(radAngle) + y1 * Math.cos(radAngle);

  let x2Rotated = x2 * Math.cos(radAngle) - y2 * Math.sin(radAngle);
  let y2Rotated = x2 * Math.sin(radAngle) + y2 * Math.cos(radAngle);

  let x3Rotated = x3 * Math.cos(radAngle) - y3 * Math.sin(radAngle);
  let y3Rotated = x3 * Math.sin(radAngle) + y3 * Math.cos(radAngle);

  let x4Rotated = x4 * Math.cos(radAngle) - y4 * Math.sin(radAngle);
  let y4Rotated = x4 * Math.sin(radAngle) + y4 * Math.cos(radAngle);

  // Translate points back
  let newX1 = x1Rotated + center[0];
  let newY1 = y1Rotated + center[1];

  let newX2 = x2Rotated + center[0];
  let newY2 = y2Rotated + center[1];

  let newX3 = x3Rotated + center[0];
  let newY3 = y3Rotated + center[1];

  let newX4 = x4Rotated + center[0];
  let newY4 = y4Rotated + center[1];

  return [
    [newX1, newY1],
    [newX2, newY2],
    [newX3, newY3],
    [newX4, newY4],
  ];
}

function setMyMap(lat, lng, init = false) {
  if (!init) {
    layers[0].remove();
    layers.pop();
  }
  coordinates = [lat, lng];
  mymap.setView([lat, lng], 20);

  let road = L.gridLayer.googleMutant({
    type: "satellite", // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
  });
  layers.push(road);
  road.addTo(mymap);
}

async function PVWatts() {
  let results = [];
  let acMonthly = new Array(12).fill(0);
  let azimuthSystem = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };
  systemArrayPanel.forEach((element) => {
    azimuthSystem[element["azimuth"]] += element["panel"].watt;
  });

  let requestUrls = [];
  let requests = [];

  for (let key in azimuthSystem) {
    if (azimuthSystem[key] != 0) {
      let request = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${NRELKEY}&lat=${
        coordinates[0]
      }&lon=${coordinates[1]}&system_capacity=${azimuthSystem[key]}&azimuth=${
        key == "north" ? 0 : key == "south" ? 180 : key == "east" ? 90 : 270
      }&tilt=20&array_type=1&module_type=1&losses=14.08`;
      requestUrls.push(request);
    }

    requests = requestUrls.map((url) => fetch(url));
  }

  Promise.all(requests)
    .then((responses) => {
      return Promise.all(responses.map((r) => r.json()));
    })
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].outputs.ac_monthly.length; j++) {
          acMonthly[j] += data[i].outputs.ac_monthly[j];
        }
      }
      console.log(acMonthly);
      updateSavingsGraph(acMonthly);
    })
    .catch((error) => {
      console.error(error);
    });
}

function updateSavingsGraph(acMonthly) {
  if (chart != null) chart.destroy();
  const ctx = document.getElementById("myChart");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "KWh",
          data: acMonthly,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function initMap() {
  // Request geolocation permission
  navigator.geolocation.getCurrentPosition(
    function (position) {
      // Get latitude and longitude
      let lat = position.coords.latitude;
      let lng = position.coords.longitude;
      coordinates = [lat, lng];
      // Use Geolocation API to get user location
      setMyMap(lat, lng, true);
    },
    function (error) {
      console.error("Unable to retrieve your location");
    }
  );
}

initMap();

fetch(
  `https://api.github.com/repos/alecdmoore/solar-system-builder/actions/secrets/public-key`
)
  .then((response) => response.json())
  .then((json) => {
    const apiKey = json.GOOGLE_API_KEY;
    console.log(json);
    // Use apiKey in code...
  });
