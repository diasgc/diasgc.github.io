const tnk = {
  sefer: 0,
  perek: 1,
  pasuk: 1,
  book: 'Bereshit',
  seferim: ["Bereshit", "Shemot", "Vayikra", "Bamidbar", "Devarim"],
  psukim: [
    [ // Bereshit
      [31], [25], [24], [26], [32], [22], [24], [22], [29], [32],
      [32], [20], [18], [24], [21], [16], [27], [33], [38], [34],
      [18], [34], [20], [67], [34], [35], [46], [22], [35], [43],
      [55], [32], [20], [31], [29], [43], [36], [30], [23], [23],
      [57], [38], [34], [34], [28], [34], [31], [22], [26], [26]
    ],
    [ // Shemot
      [22], [25], [22], [31], [23], [30], [25], [32], [35], [29],
      [10], [51], [16], [31], [27], [36], [16], [27], [25], [26],
      [36], [31], [33], [18], [40], [37], [21], [43], [46], [38],
      [18], [35], [23], [35], [35], [38], [24], [31], [43], [38]
    ],
    [ // Vayikra
      [17], [16], [17], [35], [26], [23], [38], [36], [24], [20],
      [47], [8], [59], [57], [33], [34], [16], [30], [37], [27],
      [24], [33], [44], [23], [55], [46], [34]
    ],
    [ // Bamidbar
      [54], [34], [51], [49], [31], [27], [89], [26], [23], [36],
      [35], [16], [33], [45], [41], [50], [13], [32], [22], [29],
      [35], [41], [30], [25], [18], [65], [23], [31], [39], [17],
      [54], [42], [56], [29], [34], [13]
    ],
    [ // Devarim
      [46], [37], [29], [49], [33], [25], [26], [20], [29], [22],
      [32], [32], [18], [29], [23], [22], [20], [22], [21], [20],
      [23], [30], [25], [22], [19], [19], [26], [69], [28], [20],
      [30], [52], [29], [12]
    ]
  ]
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
  options.timeZoneID = Intl.DateTimeFormat().resolvedOptions().timeZone;
  options.locationName = 'Current Location';
});

document.getElementById('pasuk-prev').addEventListener('click',() => {
  prev();
  const i = document.getElementById('verse');
  i.value = `${tnk.book} ${tnk.perek}.${tnk.pasuk}`;
  upd(i.value);
});

document.getElementById('pasuk-next').addEventListener('click',() => {
  next();
  const i = document.getElementById('verse');
  i.value = `${tnk.book} ${tnk.perek}.${tnk.pasuk}`;
  upd(i.value);
});

function prev(){
  if (tnk.pasuk > 1){
    tnk.pasuk--;
  } else {
    if (tnk.perek > 1){
      tnk.perek--;
      tnk.pasuk = tnk.psukim[tnk.sefer][tnk.perek-1][0];
    } else {
      if (tnk.sefer > 0){
        tnk.sefer--;
        tnk.perek = tnk.psukim[tnk.sefer].length;
        tnk.pasuk = tnk.psukim[tnk.sefer][tnk.perek-1][0];
      }
    }
  }
  tnk.book = tnk.seferim[tnk.sefer];
}

function next(){
  if (tnk.pasuk < tnk.psukim[tnk.sefer][tnk.perek-1][0]){
    tnk.pasuk++;
  } else {
    if (tnk.perek < tnk.psukim[tnk.sefer].length){
      tnk.perek++;
      tnk.pasuk = 1;
    } else {
      if (tnk.sefer < tnk.seferim.length-1){
        tnk.sefer++;
        tnk.perek = 1;
        tnk.pasuk = 1;
      }
    }
  }
  tnk.book = tnk.seferim[tnk.sefer];
}

tnk.book = tnk.seferim[tnk.sefer];

const i = document.getElementById('verse');
i.addEventListener('change',()=> upd(i.value));
upd(i.value);


function upd(d){
  fetchData(d,'heb-content','source');
  fetchData(d,'eng-content','translation');
}

function fetchData(ref,id,lang){
  const url = `https://www.sefaria.org/api/v3/texts/${ref}?version=${lang}`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};
  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      loadData(json,id)
    }).catch(err => console.error(err));
}

function loadData(data,id){
  if (data && data.versions && data.versions[0] && data.versions[0].text){
    var text = data.versions[0].text;
    text = text.replace(/{.*}/g,(match) => `<sup><sup><small>${match}</small></sup></sup>`);
    const e = document.getElementById(id);
    e.innerHTML = text;
  }
}

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api
