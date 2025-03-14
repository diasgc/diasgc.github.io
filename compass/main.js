//"use strict";

const compassCircle = document.querySelector(".compass-circle");
const myPoint = document.querySelector(".my-point");
const startBtn = document.querySelector(".start-btn");
const capDeg = document.querySelector(".degrees");
const capPlace = document.querySelector(".place-name");
const delta = 15;
const isIOS =
    navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
    navigator.userAgent.match(/AppleWebKit/);

const useVib = window.navigator.vibrate;

function init() {
    
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((props) => {
      startBtn.hidden = props.state === "granted";
    });

  startBtn.addEventListener("click", startCompass);
  navigator.geolocation.getCurrentPosition(locHandler);

  if (!isIOS) {
    window.addEventListener("deviceorientationabsolute", handler, true);
  }
}

function startCompass() {
  if (isIOS) {
  DeviceOrientationEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        window.addEventListener("deviceorientation", handler, true);
        startBtn.hidden = true;
      } else {
        alert("has to be allowed!");
      }
    })
    .catch(() => alert("not supported"));
  }
}

let pointDegree;

// Har Habait
const point = {
  lat: 31.777493,
  lng: 35.235799
};

const places = [
  { name: "Har Habait",   lat: 31.777493, lng: 35.235799,  brg: 0 },
  { name: "Mecca",        lat: 21.426640, lng: 39.825630,  brg: 0 },
  { name: "Rome",         lat: 41.902782, lng: 12.496366,  brg: 0 },
  { name: "Tokyo",        lat: 35.652832, lng: 139.839478, brg: 0 },
  { name: "Seoul",        lat: 37.532600, lng: 127.024612, brg: 0 },
  { name: "Benjing",      lat: 39.916668, lng: 116.383331, brg: 0 },
  { name: "Paris",        lat: 48.864716, lng: 2.349014,   brg: 0 },
  { name: "London",       lat: 51.509865, lng:-0.118092,   brg: 0 },
  { name: "New York",     lat: 40.730610, lng:-73.935242,  brg: 0 },
  { name: "Berlin",       lat: 52.520007, lng: 13.404954,  brg: 0 },
  { name: "Moscow",       lat: 55.751244, lng: 37.618423,  brg: 0 },
  { name: "Buenos Aires", lat:-34.60372,  lng:-58.381592,  brg: 0 },
  { name: "Cape Town",    lat:-33.918861, lng: 18.423300,  brg: 0 }
]


function handler(e) {
  let compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
  compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass}deg)`;

  if ( useVib && compass % 10 === 0)
    window.navigator.vibrate(2);

  var deg = compass.toFixed(1) + "º";
  var plist = [];
  const delta = 5;
  var matches = 0;
  
  places.forEach( function(place) {
    let c = Math.abs(compass);
    if ( ! ((place.brg < c && place.brg + delta > c) ||
      place.brg > Math.abs(compass + delta) || 
      place.brg < c)) {
        plist.push(place.name);
        matches += 1;
      }
  });

  capDeg.innerHTML = deg;
  
  if (matches > 0){
    capPlace.style.opacity = 1;
    myPoint.style.opacity = 1;
    capPlace.innerHTML = plist.join(" * ");
    if (useVib)
      window.navigator.vibrate(10);
  } else {
    capPlace.style.opacity = 0;
    myPoint.style.opacity = 0;
    capPlace.innerHTML = "";
  }  
}

function locHandler(position) {
  const { latitude, longitude } = position.coords;
  places.forEach(function(place){
    place.brg = ( bearing(latitude, longitude, place.lat, place.lng) + 360 % 360 );
    console.log(JSON.stringify(places,null,2));
  });
}

const d2r = Math.PI / 180.0;

function bearing(currLat, currLong, targLat, targLong) {    
  let dlng = (targLong - currLong) * d2r;
  let lat1 = currLat * d2r;
  let lat2 = targLat * d2r;
  var y = Math.sin(dlng) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
  var brng = Math.atan2(y, x) / d2r;
  return Math.round(brng);
}

function locationHandler(position) {
  const { latitude, longitude } = position.coords;
  pointDegree = calcDegreeToPoint(latitude, longitude);

  if (pointDegree < 0) {
    pointDegree = pointDegree + 360;
  }
}

function handler_old(e) {
  compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
  compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass}deg)`;

  // ±15 degree
  if (
    (pointDegree < Math.abs(compass) &&
        pointDegree + delta > Math.abs(compass)) ||
    pointDegree > Math.abs(compass + delta) ||
    pointDegree < Math.abs(compass)
  ) {
    myPoint.style.opacity = 0;
  } else if (pointDegree) {
    myPoint.style.opacity = 1;
  }
}

function calcDegreeToPoint(latitude, longitude) {

  const phiK = point.lat * d2r;
  const lambdaK = point.lng * d2r;
  const phi = latitude* d2r;
  const lambda = longitude * d2r;
  const psi =  Math.atan2(
        Math.sin(lambdaK - lambda),
        Math.cos(phi) * Math.tan(phiK) -
        Math.sin(phi) * Math.cos(lambdaK - lambda)
  ) / d2r;
  return Math.round(psi);
}


init();