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
      [47],  [8], [59], [57], [33], [34], [16], [30], [37], [27],
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
  ],
  parshiot: [
    { "Bereshit": "0;1:1–6:8" },
    { "Noach": "0;6:9–11:32" },
    { "Lech-Lecha": "0;12:1–17:27" },
    { "Vayera": "0;18:1–22:24" },
    { "Chayei Sarah": "0;23:1–25:18" },
    { "Toldot": "0;25:19–28:9" },
    { "Vayetzei": "0;28:10–32:3" },
    { "Vayishlach": "0;32:4–36:43" },
    { "Vayeshev": "0;37:1–40:23" },
    { "Miketz": "0;41:1–44:17" },
    { "Vayigash": "0;44:18–47:27" },
    { "Vayechi": "0;47:28–50:26" },
    { "Shemot": "1;1:1–6:1" },
    { "Vaera": "1;6:2–9:35" },
    { "Bo": "1;10:1–13:16" },
    { "Beshalach": "1;13:17–17:16" },
    { "Yitro": "1;18:1–20:23" },
    { "Mishpatim": "1;21:1–24:18" },
    { "Terumah": "1;25:1–27:19" },
    { "Tetzaveh": "1;27:20–30:10" },
    { "Ki Tisa": "1;30:11–34:35" },
    { "Vayakhel": "1;35:1–38:20" },
    { "Pekudei": "1;38:21–40:38" },
    { "Vayikra": "2;1:1–5:26" },
    { "Tzav": "2;6:1–8:36" },
    { "Shemini": "2;9:1–11:47" },
    { "Tazria": "2;12:1–13:59" },
    { "Metzora": "2;14:1–15:33" },
    { "Acharei Mot": "2;16:1–18:30" },
    { "Kedoshim": "2;19:1–20:27" },
    { "Emor": "2;21:1–24:23" },
    { "Behar": "2;25:1–26:2" },
    { "Bechukotai": "2;26:3–27:34" },
    { "Bamidbar": "3;1:1–4:20" },
    { "Naso": "3;4:21–7:89" },
    { "Behaalotecha": "3;8:1–12:16" },
    { "Shelach": "3;13:1–15:41" },
    { "Korach": "3;16:1–18:32" },
    { "Chukat": "3;19:1–22:1" },
    { "Balak": "3;22:2–25:9" },
    { "Pinchas": "3;25:10–30:1" },
    { "Matot": "3;30:2–32:42" },
    { "Masei": "3;33:1–36:13" },
    { "Devarim": "4;1:1–3:22" },
    { "Vaetchanan": "4;3:23–7:11" },
    { "Eikev": "4;7:12–11:25" },
    { "Reeh": "4;11:26–16:17" },
    { "Shoftim": "4;16:18–21:9" },
    { "Ki Teitzei": "4;21:10–25:19" },
    { "Ki Tavo": "4;26:1–29:8" },
    { "Nitzavim": "4;29:9–30:20" },
    { "Vayelech": "4;31:1–30" },
    { "Haazinu": "4;32:1–52" },
    { "Vezot Haberakhah": "4;33:1–34:12" }
  ]
}

const refId = document.getElementById('pasuk-ref');

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
  refId.innerText = d;
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
