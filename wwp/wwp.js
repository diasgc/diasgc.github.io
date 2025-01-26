const wwprov = {
  home: "https://open-meteo.com/",
  docs: "https://open-meteo.com/en/docs",
  flds: [ 'temperature_2m','precipitation','surface_pressure','wind_speed_10m','soil_moisture_27_to_81cm' ],
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
    sunset: 0,
    sunrise: 0,
    update: function(){
      const date = new Date();
      const times = SunCalc.getTimes(date, wwprov.pos.latitude, wwprov.pos.longitude);
      const sunPosition = SunCalc.getPosition(date, latitude, longitude);
      wwprov.sun.elevRad = sunPosition.altitude;
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
    }
  },
  update: function(){
    wwprov.pos.update(() => {
      wwprov.sun.update();
      wwprov.wth.update();
    });
  },
  load: function(callback){
    let cache = localStorage.getItem('wwprov');
    if (cache){
      wwprov.wth.timestamp = cache.timestamp;
      wwprov.pos.latitude = cache.latitude;
      wwprov.pos.longitude = cache.longitude;
      wwprov.wth.data = cache.wwdata;
      if (callback) callback();
    }
  },
  save: function(){
    let cache = {
      timestamp: wwprov.wth.timestamp,
      latitude: wwprov.latitude,
      longitude: wwprov.longitude,
      wwdata: wwprov.wth.data
    }
    localStorage.setItem('wwprov', cache);
  },
  clearCache: function(){
    localStorage.setItem('wwprov', null);
  }
}

let glcanvas = document.getElementById('gl-canvas');
let webGl;

window.onload = function(){
  webGl = new GlCanvas('gl-canvas');
  webGl.load({
    fragmentAsset: 'wwp.frag',
    vertexAsset: 'wwp.vert'
   }, gl => gl.start());
}