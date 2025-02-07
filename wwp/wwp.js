Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

let demo = true;

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
          wwprov.timestamp = Date.now();
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
  webGl.start(demo);
  if (!demo)
    setInterval(upd, 1000);
}
function upd(){
  setUniforms();
  webGl.render();
}

const info = document.getElementById('info');
function setUniforms(){
  wwprov.sun.update();
  let elev = wwprov.sun.elevAbs;
  webGl.uniforms.uSunPosition.data = [elev];
  let clds = wwprov.wth.get('cloud_cover') / 100.0;
  webGl.uniforms.uClouds.data = [clds];
  let hum = wwprov.wth.get('relative_humidity_2m') / 100.0;
  webGl.uniforms.uHumidity.data = [hum];
  let moon = wwprov.sun.moon;
  webGl.uniforms.uMoon.data = [moon];
  let rain = wwprov.wth.get('precipitation') / 100.0;
  webGl.uniforms.uRain.data = [rain];
  let temp = wwprov.wth.get('temperature_2m');
  info.innerHTML = `e: ${elev.toFixed(4)} m: ${moon.toFixed(1)} | ${temp.toFixed(1)}ºC ${hum * 100}%Hr c: ${clds.toFixed(2)} pp: ${rain.toFixed(2)}`;
  webGl.uniforms.uTemperature.data = [temp + 273.15];
}

function reset(){
  wwprov.clearCache();
  wwprov.update();
}

window.onload = function(){
  
  let w = new GlCanvas('gl-canvas');
  wwprov.load(() => {
    w.load({
      fragmentCode: frag,
      uniforms: {
        uSunPosition: { type: 'float' },
        uClouds: { type: 'float' },
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
https://www.shadertoy.com/view/tltGDM (this)
https://www.shadertoy.com/view/wtlyzB
https://www.shadertoy.com/view/wsfGWH
https://www.shadertoy.com/view/Ntd3Ws (simple, no sun)
https://www.shadertoy.com/view/4tVSRt (simple, with sun)
https://www.shadertoy.com/view/WdByDV
https://www.shadertoy.com/view/tsXBzM (terrain)
https://www.shadertoy.com/view/wllyW4 (nice colors)
*/