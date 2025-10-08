function rotate(d){
  //const dd = d.getTime()/1000 % 86400 / 86400 * 360;
  const dd = (d.getHours()*60 + d.getMinutes()) / 1440 * 360;
  img.style.transform = `rotate(${-dd}deg)`;
  options.date = d;
  options.timeZoneOffset = d.getTimezoneOffset()/60;
  const zmanim = KosherZmanim.getZmanimJson(options);
  document.getElementById('zman').innerHTML = JSON.stringify(zmanim).replace(/,/g,'<br/>').replace(/{|}/g,'');  
}


const options = {
  date: new Date(),
  latitude: 32.0853,
  longitude: 34.7818,
  timeZoneID: 'Europe/Lisbon',
  elevation: 0,
  locationName: 'Porto',
  complexZmanim: false
};

navigator.geolocation.getCurrentPosition(position => {
  options.latitude = position.coords.latitude;
  options.longitude = position.coords.longitude;
  options.elevation = position.coords.altitude || 0;
  options.timeZoneID = Temporal.Now.timeZoneId();
});

const img = document.getElementById('iclock');
rotate(new Date());

setInterval(()=>{
    const t = document.getElementById('time');
    const d = new Date();
    rotate(d);
    t.innerText = `${d.getHours()}:${d.getMinutes()}`;
},5000);

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api
