Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

const wwprov = {
  home: "https://open-meteo.com/",
  docs: "https://open-meteo.com/en/docs",
  flds: [ 'temperature_2m','relative_humidity_2m','precipitation','surface_pressure','wind_speed_10m','soil_moisture_27_to_81cm' ],
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
    update: function(){
      const date = new Date();
      const times = SunCalc.getTimes(date, wwprov.pos.latitude, wwprov.pos.longitude);
      //if (!date.isDstObserved())
      //  date.setHours(date.getHours() + 1);
      const sunPosition = SunCalc.getPosition(date, wwprov.pos.latitude, wwprov.pos.longitude);
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
          callback();
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
  webGl.start(false);
}


function setUniforms(){
  wwprov.sun.update();
  let a = wwprov.sun.elevAbs;
  console.log(a);
  webGl.uniforms.uSunPosition.data = [a];
  let moist = wwprov.wth.get('relative_humidity_2m') / 100.0;
  webGl.uniforms.uAtmosphere.data = [moist];
}

function reset(){
  wwprov.clearCache();
  wwprov.update(() => {
    setUniforms();
    webGl.render();
  });
}

window.onload = function(){
  //wwprov.clearCache();
  let w = new GlCanvas('gl-canvas');
  wwprov.load(() => {
    w.load({
      fragmentCode: frag,
      uniforms: {
        uSunPosition: {
          type: 'float',
        },
        uAtmosphere: {
          type: 'float',
        }
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
*/