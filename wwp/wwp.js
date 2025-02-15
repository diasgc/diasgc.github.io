Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

const settings = {
  live: false,
  timeId: document.getElementById('time'),
  sunPos: 'auto',
  humidity: 'auto',
  clouds: 'auto',
  cloudsLow: 'auto',
  rain: 'auto',
  moon: 'auto',
  init: function(){
    document.getElementById('bsettings').addEventListener('change', (e) => {
      document.getElementById('settings').style.display = e.target.checked ? 'inline' : 'none';
    });
    //document.getElementById('binfo').addEventListener('change', (e) => {
    //  document.getElementById('info').style.display = e.target.checked ? 'inline' : 'none';
    //});
    document.getElementById('s1').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.sunPos = i < 0 ? 'auto' : 2.0 * (i - 50) / 100.0;
      document.getElementById('l1').innerHTML = "sunposition: " + settings.sunPos;
    });
    document.getElementById('s2').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.humidity = i < 0 ? 'auto' : i / 100.0;
      document.getElementById('l2').innerHTML = "humidity: " + settings.humidity;
    });
    document.getElementById('s3').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.clouds = i < 0 ? 'auto' : i / 100.0;
      document.getElementById('l3').innerHTML = "clouds: " + settings.clouds;
    });
    document.getElementById('s4').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.cloudsLow = i < 0 ? 'auto' : i / 100.0;
      document.getElementById('l4').innerHTML = "clouds low: " + settings.cloudsLow;
    });
    document.getElementById('s5').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.rain = i < 0 ? 'auto' : i / 100.0;
      document.getElementById('l5').innerHTML = "rain: " + settings.rain;
    });
    document.getElementById('s6').addEventListener('change', (e) => {
      let i =  parseInt(e.target.value);
      settings.moon = i < 0 ? 'auto' : i / 100.0;
      document.getElementById('l6').innerHTML = "moon: " + settings.moon;
    });
  }
}

const wwprov = {
  home: "https://open-meteo.com/",
  docs: "https://open-meteo.com/en/docs",
  flds: [ "temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "visibility" ],
  kind: 'hourly', //'current',
  timestamp: 0,
  timeout: 24 * 60 * 60 * 1000, 
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
      xhr.onload = function() {
        var status = xhr.status;
        if (status === 200) {
          wwprov.wth.data = JSON.parse(JSON.stringify(xhr.response));
          wwprov.wth.timestamp = Date.now();
          wwprov.save();
          if (callback) callback();
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
      return wwprov.wth.data.hourly[field][i];
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
  if (!settings.live)
    setInterval(upd, 1000);
}
function upd(){
  setUniforms();
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
  let rain = settings.rain === 'auto' ? wwprov.wth.get('precipitation') / 100.0 : settings.rain; //wwprov.wth.get('precipitation') / 100.0;
  webGl.uniforms.uRain.data = [rain];
  let temp = wwprov.wth.get('temperature_2m');
  updateNow(elev.toFixed(4),moon.toFixed(1),temp.toFixed(1),hum*100,clds*100,cldL*100,rain);
  //info.innerHTML = `e: ${elev.toFixed(4)} m: ${moon.toFixed(1)} | ${temp.toFixed(1)}ºC ${hum * 100}%Hr c/L: ${clds.toFixed(2)}/${cldL.toFixed(2)} pp: ${rain.toFixed(2)}`;
  webGl.uniforms.uTemperature.data = [temp + 273.15];
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


function updateNow(elev, moon, temp, hum, clds, cldL, rain){
  let i = document.getElementById('wwp-now');
  let deg = elev * 57.2957795;
  i.innerHTML = `solar elevation: ${elev} rad, ${deg.toFixed(2)}º<br>
  moon age: ${moon * 29.5}d<br>
  temp.: ${temp}ºC<br>
  Relative Humidity: ${hum.toFixed(1)}%<br>
  Cloudiness (total): ${clds.toFixed(1)}%<br>
  Low clouds: ${cldL.toFixed(1)}%<br>
  Precipitation: ${rain.toFixed(1)} mm`
}

window.onload = function(){
  settings.init();
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
        uTemperature: { type: 'float' }
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