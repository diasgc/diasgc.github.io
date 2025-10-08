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
  options.timeZoneID = Intl.DateTimeFormat().resolvedOptions().timeZone;
  options.locationName = 'Current Location';
});

const i = document.getElementById('verse');
i.addEventListener('change',()=> fetchData(i.value));
fetchData(i.value);

function fetchData(ref){
  const url = `https://www.sefaria.org/api/v3/texts/${ref}?version=hebrew`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};
  fetch(url, options)
    .then(res => res.json())
    .then(json => loadData(json))
    .catch(err => console.error(err));
}

function loadData(data){
  const heb = document.getElementById('heb-content');
  const eng = document.getElementById('eng-content');
  heb.innerHTML = data.versions[0].text;
  //eng.innerHTML = data.text.join(' ');
}

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api
