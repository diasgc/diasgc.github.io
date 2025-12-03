Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/wwp/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const settings = {
  urlParams: null,
  bId: document.getElementById('bsettings'),
  sId: document.getElementById('settings'),
  live: false,
  rate: 2000,
  timeId: document.getElementById('time'),
  sunPos: 'auto',
  humidity: 'auto',
  clouds: 'auto',
  cloudsLow: 'auto',
  rain: 'auto',
  moon: 'auto',
  wind: 'auto',
  init2: function(){
    this.urlParams = new URLSearchParams(window.location.search);
    this.rate = parseInt(this.urlParams.get('live') || 2000);
    this.live = this.rate === 0;
    this.bId.addEventListener('change', settings.toggleSettings);
    if (this.urlParams.get('info'))
      this.bId.click();
    let d = document.getElementById('sinput');
    d.replaceChildren();
    settings.add(d, "sun position", -1, 100, -1, (v,l) => {
      settings.sunPos = v < 0 ? 'auto' : Math.PI * (v - 50) / 100.0;
      l.innerHTML = "sunposition: " +  (v < 0 ? "auto" : ((180/Math.PI) * settings.sunPos).toFixed(1) + "º");
    });
    settings.add(d, "humidity", -1, 100, -1, (v,l) => {
      settings.humidity = v < 0 ? 'auto' : v / 100.0;
      l.innerHTML = "humidity: " + (v < 0 ? "auto" : settings.humidity * 100 + "%");
    });
    settings.add(d, "clouds", -1, 100, -1, (v,l) => {
      settings.clouds = v < 0 ? 'auto' : v / 100.0;
      l.innerHTML = "clouds: " + (v < 0 ? "auto" : settings.clouds * 100 + "%");
    });
    settings.add(d, "clouds low", -1, 100, -1, (v,l) => {
      settings.cloudsLow = v < 0 ? 'auto' : v / 100.0;
      l.innerHTML = "clouds low: " + (v < 0 ? "auto" : settings.cloudsLow * 100 + "%");
    });
    settings.add(d, "rain", -1, 100, -1, (v,l) => {
      settings.rain = v < 0 ? 'auto' : v / 10.0;
      l.innerHTML = "rain: " + settings.rain + (v < 0 ? "" : " mm");
    });
    settings.add(d, "moon", -1, 100, -1, (v,l) => {
      settings.moon = v < 0 ? 'auto' : v / 100.0;
      l.innerHTML = "moon: " + (v < 0 ? "auto" : (settings.moon * 29.53).toFixed(1) + " d");
    });
    settings.add(d, "wind", -1, 200, -1, (v,l) => {
      settings.wind = v < 0 ? 'auto' : v;
      l.innerHTML = "wind: " + settings.wind + (v < 0 ? "" : " km/h");
    });
  },
  toggleSettings: function(){
    settings.sId.style.display = settings.bId.checked ? 'inline' : 'none';
  },
  add: function(d,lab,min,max,def, onchangeListener){
    let n = d.childElementCount + 1;
    let s = document.createElement('input');
    s.type = 'range';
    s.min = min;
    s.max = max;
    s.step = 1;
    s.value = def;
    s.id = 's' + n;
    let l = document.createElement('label');
    l.id = 'l' + n;
    l.setAttribute('for', 's' + n);
    d.appendChild(l);
    d.appendChild(s);
    s.addEventListener('change', (e) => {
      onchangeListener(e.target.value, l);
    });
    onchangeListener(def, l);
  }
}

const wwprov = {
  home: "https://open-meteo.com/",
  docs: "https://open-meteo.com/en/docs",
  flds: [ "temperature_2m", "relative_humidity_2m", "rain", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "visibility","wind_speed_10m" ],
  kind: 'hourly', //'current',
  timestamp: 0,
  timeout: 24 * 60 * 60 * 1000,
  status: document.getElementById('webstatus'),
  url: function(kind, fields){
    const f = fields.join();
    return `https://api.open-meteo.com/v1/forecast?latitude=${wwprov.pos.latitude}&longitude=${wwprov.pos.longitude}&${kind}=${f}`;
  },
  pos: {
    latitude: 0,
    longitude: 0,
    update: function(callback){
      navigator.geolocation.getCurrentPosition(position => {
        wwprov.pos.latitude = position.coords.latitude;
        wwprov.pos.longitude = position.coords.longitude;
        if (callback) callback();
      });  
    }
  },
  sun: {
    elevRad: 0,
    elevAbs: 0,
    sunset: 0,
    sunrise: 0,
    moon: 0,
    update: function(){
      const date = new Date();
      const times = SunCalc.getTimes(date, wwprov.pos.latitude, wwprov.pos.longitude);
      //if (!date.isDstObserved())
      //  date.setHours(date.getHours() + 1);
      const sunPosition = SunCalc.getPosition(date, wwprov.pos.latitude, wwprov.pos.longitude);
      wwprov.sun.moon = SunCalc.getMoonIllumination(date).phase;
      wwprov.sun.elevRad = sunPosition.altitude;
      wwprov.sun.elevAbs = wwprov.sun.elevRad / Math.PI * 2.0;
      wwprov.sun.sunrise = times.sunrise.toLocaleTimeString();
      wwprov.sun.sunset = times.sunset.toLocaleTimeString();
    }
  },
  wth: {
    data: {},
    timestamp: 0,
    timeout: 24 * 60 * 60 * 1000, 
    getData: function(callback){
      let url = wwprov.url('hourly', wwprov.flds);
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      wwprov.status.style.background = '#0c0';
      xhr.onload = function() {
        var status = xhr.status;
        if (status === 200) {
          wwprov.wth.data = JSON.parse(JSON.stringify(xhr.response));
          wwprov.wth.timestamp = Date.now();
          wwprov.save();
          wwprov.status.style.background = 'transparent';
          if (callback) callback();
        } else {
          wwprov.status.style.background = '#c00';
        }
      };
      xhr.send();
    },
    update: function(callback){
      if (Date.now() - wwprov.wth.timestamp > wwprov.wth.timeout){
        wwprov.wth.getData(callback);
      }
    },
    get: function(field){
      let i = wwprov.wth.data.hourly.time.indexOf(new Date().toISOString().substring(0,14)+"00");
      return i < 0 ? 0 : wwprov.wth.data.hourly[field][i];
    }
  },
  update: function(callback){
    wwprov.pos.update(() => {
      wwprov.sun.update();
      wwprov.wth.update(callback);
    });
  },
  load: function(callback){
    let cache = localStorage.getItem('wwprov');
    if (cache){
      cache = JSON.parse(cache);
      wwprov.wth.timestamp = cache.timestamp;
      wwprov.pos.latitude = cache.latitude;
      wwprov.pos.longitude = cache.longitude;
      wwprov.wth.data = cache.wwdata;
      if (callback) callback();
    } else {
      wwprov.update(callback);
    }
  },
  save: function(){
    let cache = {
      timestamp: wwprov.wth.timestamp,
      latitude: wwprov.pos.latitude,
      longitude: wwprov.pos.longitude,
      wwdata: wwprov.wth.data
    }
    localStorage.setItem('wwprov', JSON.stringify(cache));
  },
  clearCache: function(){
    localStorage.removeItem('wwprov');
  }
}

let glcanvas = document.getElementById('gl-canvas');
let webGl;

function init(gl){
  webGl = gl;
  setUniforms();
  webGl.start(settings.live);
  setInterval(upd, settings.rate);
}
function upd(){
  setUniforms();
  if (!settings.live)
    webGl.render();
}

const info = document.getElementById('info');
function setUniforms(){
  wwprov.sun.update();
  let elev = settings.sunPos === 'auto' ? wwprov.sun.elevRad : settings.sunPos;
  webGl.uniforms.uSunPosition.data = [elev];
  let clds = settings.clouds === 'auto' ? wwprov.wth.get('cloud_cover') / 100.0 : settings.clouds;
  webGl.uniforms.uClouds.data = [clds];
  let cldL = settings.cloudsLow === 'auto' ? wwprov.wth.get('cloud_cover_low') / 100.0 : settings.cloudsLow;
  webGl.uniforms.uCloudLow.data = [cldL];
  let hum = settings.humidity === 'auto' ? wwprov.wth.get('relative_humidity_2m') / 100.0 : settings.humidity; //wwprov.wth.get('relative_humidity_2m') / 100.0;
  webGl.uniforms.uHumidity.data = [hum];
  let moon = settings.moon === 'auto' ? wwprov.sun.moon : settings.moon; //wwprov.sun.moon;
  webGl.uniforms.uMoon.data = [moon];
  let rain = settings.rain === 'auto' ? wwprov.wth.get('rain'): settings.rain; //wwprov.wth.get('precipitation') / 100.0;
  webGl.uniforms.uRain.data = [rain];
  let temp = wwprov.wth.get('temperature_2m');
  webGl.uniforms.uTemperature.data = [temp + 273.15];
  let wind10 = settings.wind === 'auto' ? wwprov.wth.get('wind_speed_10m') : settings.wind;
  webGl.uniforms.uWind.data = [wind10];
  updateNow(elev.toFixed(4),moon.toFixed(1),temp.toFixed(1),hum*100,clds*100,cldL*100,rain, wind10);
}

function reset(){
  let d = document.getElementById('reset');
  d.style.color = '#bb0';
  wwprov.clearCache();
  wwprov.update(() => {
    d.style.color = '#0b0';
    updateInfo();
  });
}

function updateInfo(){
  let i = document.getElementById('wwp-info');
  i.innerHTML = `last update: ${new Date(wwprov.wth.timestamp).toISOString()}<br>
  gps: lat: ${wwprov.pos.latitude.toFixed(4)} long: ${wwprov.pos.longitude.toFixed(4)}<br>
  data from: ${wwprov.wth.data.hourly.time[0]} to ${wwprov.wth.data.hourly.time[wwprov.wth.data.hourly.time.length - 1]}`
}


function updateNow(elev, moon, temp, hum, clds, cldL, rain, wind){
  let i = document.getElementById('wwp-now');
  let deg = elev * 57.2957795;
  i.innerHTML = `solar elevation: ${elev} rad, ${deg.toFixed(2)}º<br>
  moon age: ${moon * 29.5}d<br>
  temp.: ${temp}ºC<br>
  Relative Humidity: ${hum.toFixed(1)}%<br>
  Cloudiness (total): ${clds.toFixed(1)}%<br>
  Low clouds: ${cldL.toFixed(1)}%<br>
  Precipitation mm: ${rain.toFixed(1)}<br>
  Wind km/h: ${wind.toFixed(1)}`
}

window.onload = function(){
  settings.init2();
  wwprov.status.addEventListener('click', () => reset());
  let w = new GlCanvas('gl-canvas');
  wwprov.load(() => {
    updateInfo();
    w.load({
      fragmentAsset: 'shaders/default.frag',
      uniforms: {
        uSunPosition: { type: 'float' },
        uClouds: { type: 'float' },
        uCloudLow: { type: 'float' },
        uHumidity: { type: 'float' },
        uMoon: { type: 'float' },
        uRain: { type: 'float' },
        uTemperature: { type: 'float' },
        uWind: { type: 'float' }
      }
     }, gl => init(gl))
  });
}

/*
SHADERS
https://github.com/shff/opengl_sky
https://www.shadertoy.com/view/tltGDM (this)
https://www.shadertoy.com/view/wtlyzB
https://www.shadertoy.com/view/wsfGWH
https://www.shadertoy.com/view/Ntd3Ws (simple, no sun)
https://www.shadertoy.com/view/4tVSRt (simple, with sun)
https://www.shadertoy.com/view/WdByDV
https://www.shadertoy.com/view/tsXBzM (terrain)
https://www.shadertoy.com/view/wllyW4 (nice colors)
https://www.shadertoy.com/view/fsdGWf (terrain lightning)
*/