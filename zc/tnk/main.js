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
  ],
  transLang: 'portuguese',
  ref: 'Bereshit 1.1',
  text: [],
  transl: '',
  otSeq: '',
  setText: function(t){
    this.text[0] = t;
    this.text[1] = KBLH.removeTaamim(t);
    this.text[2] = KBLH.removeNikud(t);
    this.otSeq = KBLH.getOtiot(t);
  },
  getText: function(mode=this.txtMode){
    return this.text[mode].replace(/{.*}/g,(match) => `<sup><small><small>${match}</small></small></sup>`);;
  },
  countMilim: function(){
    if (!this.text[0]) return 0;
    const words = this.text[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    return words.length;
  },
  countOtiot: function(){
    return this.otSeq.length;
  },
  txtMode: 1
}

const localCache = {
  cache: null,
  load: function(){
    if (window.localStorage){
      const c = window.localStorage.getItem('tnk');
      this.cache = c ? JSON.parse(c) : {}; 
    }
  },
  update: function(){
    if (window.localStorage){
      this.cache[tnk.ref] = {"heb": tnk.text[0], "transl": tnk.transl};
      localStorage.setItem("tnk", JSON.stringify(this.cache)); 
    }
  },
  hasRef: function(ref=tnk.ref){
    return this.cache && this.cache[ref];
  },
  setTnk: function(ref){
    if (this.hasRef(ref)){
      tnk.setText(this.cache[ref].heb);
      tnk.transl = this.cache[ref].transl;
    }
  }
}

const zmanim = {
  options: {
    date: new Date(),
    latitude: 32.0853,
    longitude: 34.7818,
    timeZoneID: 'Europe/Lisbon',
    elevation: 0,
    locationName: 'Porto',
    complexZmanim: false  
  },
  refresh: function(callback){
    navigator.geolocation.getCurrentPosition(position => {
      zmanim.options.latitude = position.coords.latitude;
      zmanim.options.longitude = position.coords.longitude;
      zmanim.options.elevation = position.coords.altitude || 0;
      zmanim.options.timeZoneID = Intl.DateTimeFormat().resolvedOptions().timeZone;
      zmanim.options.locationName = 'Current Location';
      zmanJS.locations(position.coords.latitude, position.coords.longitude, position.coords.altitude || 0)
      if (callback)
        callback();
    });
  },
  getParshaOfTheWeek: function(){
    zmanJS.hdate();
    zmanJS.convertDate(new Date());
    var parshaIndex = zmanJS.getparshaHashavua();
    parshaIndex = parshaIndex % tnk.parshiot.length;
    return Object.keys(tnk.parshiot[parshaIndex])[0];
  }
}

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
  refresh();
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
  refresh();
}

function fetchSefaria(ref, v, callback){
  const opts = {method: 'GET', headers: {accept: 'application/json'}};
  fetch(`https://www.sefaria.org/api/v3/texts/${ref}?version=${v}`, opts)
    .then(res => res.json())
    .then(json => callback(json));
}

function download(ref, callback){
  webStat.style.opacity = 1;
  fetchSefaria(ref, 'source', (j) => {
    tnk.setText(j.versions[0].text);
    fetchSefaria(ref, tnk.transLang, (k) => {
      tnk.transl = k.versions[0].text;
      callback();
      webStat.style.opacity = 0;
    });
  });
}

function refresh(){
  tnk.book = tnk.seferim[tnk.sefer];
  tnk.ref = `${tnk.book} ${tnk.perek}.${tnk.pasuk}`;
  if (localCache.hasRef()){
    localCache.setTnk(tnk.ref);
    updateUi();
  } else {
    download(tnk.ref,() => {
      localCache.update();
      updateUi();
    });
  };
}

const wgem = document.getElementById('gem-content');

function updateUi(){
  wgem.innerText = '';
  let heTxt = KBLH.htmlSpanWords(tnk.getText(),'hewClick');
  fadeInText(he, heTxt);
  fadeInText(lg, tnk.transl);
  const sef = document.getElementById('href-sefaria');
  sef.href = `https://www.sefaria.org/${tnk.book}.${tnk.perek}?lang=bi&with=Translations&lang2=en`;
  fadeInText(refId, tnk.ref);
  i.innerText = tnk.ref;
  rf.innerText = tnk.ref;
  let nfo =`milim: ${tnk.countMilim()}`;
  nfo += ` · ot: ${tnk.countOtiot()}`;
  nfo += ` · gematria: ${KBLH.getGematria(tnk.otSeq)}`;
  nfo += addMatrixInfo();
  info.innerHTML = nfo;
}

function hewClick(element, event){  
  const v = KBLH.removeNikud(element.innerText);
  wgem.innerHTML = `<span class='heb-text'>${v}</span><br><span>ot: ${KBLH.countOtiot(v)} gematria: ${KBLH.getGematria(v)}`;
  if (1)
    return;
  fetch("https://libretranslate.com/translate", {
    method: "POST",
    body: JSON.stringify({
      q: v,
      source: "he",
      target: "en"
    }),
    headers: { "Content-Type": "application/json" }
  }).then(res => res.json())
    .then(json => wgem.innerHTML += JSON.stringify(json));
}

function addMatrixInfo(){
  const matrix = KBLH.getMatrixDimArray(3, tnk.otSeq);
  let out = '';
  const e = document.getElementById('matrix');
  e.replaceChildren();
  if (matrix.str){
    for (let i=0; i < matrix.array.length; i++){
      out += `<span class="matrix-span" onclick="showMatrix(this, event)">${matrix.array[i][0]}x${matrix.array[i][1]}</span>`;
      if (matrix.array[i][0] !== matrix.array[i][1])
        out += `<span class="matrix-span" onclick="showMatrix(this, event)">${matrix.array[i][1]}x${matrix.array[i][0]}</span>`;
    }
    return ` · matrix: ${out}`;
  }
  return '';
}

function showMatrix(element, event){
  event.stopPropagation();
  const m = element.innerText.split('x').map(x => parseInt(x));

  const pid = document.getElementById('pan-matrix');
  pid.style.display = 'block';

  const btn = document.getElementById('pan-matrix-dismiss');
  btn.addEventListener('click', () => pid.style.display = 'none');
  
  const hdr = document.getElementById('pan-matrix-head');
  hdr.innerHTML = `matrix ${m[0]}x${m[1]}`;
  
  const e = document.getElementById('pan-matrix-body');
  e.replaceChildren();
  
  const grid = document.createElement('div');
  grid.className = 'matrix-grid';
  grid.style.gridTemplateColumns = `repeat(${m[1]}, auto)`;
  let clz = 'matrix-span-cell';
  if (Math.max(m[1],m[0]) > 12) clz +="-small";
  for (let i=0; i < tnk.otSeq.length; i++){
    const span = document.createElement('span');
    span.className = clz;
    span.innerText = tnk.otSeq[i];
    span.addEventListener('click',()=> hdr.innerHTML = `matrix ${m[0]}x${m[1]} pos: ${i} gem: ${KBLH.mispar[tnk.otSeq[i]]}`);
    grid.appendChild(span);
  }
  e.appendChild(grid);
  e.style.display = 'block';
}

function fadeInText(element, newText){
  element.style.opacity = 0;
  element.style.animation = 'none';
  void element.offsetWidth;
  element.innerHTML = newText;
  element.style.animation = 'fadeIn 0.5s ease-in-out forwards';
}

function neq(){
  const cap = [ 'אָ֗','אֱ','א' ];
  const id = document.getElementById('nav-neq');
  tnk.txtMode = (tnk.txtMode + 1) % 3;
  id.innerText = `${cap[tnk.txtMode]}`;
  refresh();
}

function settings(){
  const zmanim = new Zmanim(options);
  const shaaZmanit = zmanim.getShaahZmanit();
}

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}


localCache.load();

document.getElementById('pasuk-prev').addEventListener('click',prev);
document.getElementById('pasuk-next').addEventListener('click',next);
document.getElementById('nav-prev').addEventListener('click',prev);
document.getElementById('nav-next').addEventListener('click',next);
document.getElementById('nav-search').addEventListener('click',search);
document.getElementById('verse2').addEventListener('click',search);
document.getElementById('nav-neq').addEventListener('click',neq);

const i = document.getElementById('verse2');
const he = document.getElementById('heb-content');
const lg =  document.getElementById('eng-content');
const rf = document.getElementById('pasuk-ref');;
const refId = document.getElementById('pasuk-ref');
const info = document.getElementById('info-content');
const webStat = document.getElementById('web-stat');

refresh();

zmanim.refresh(() => {
  const parsha = document.getElementById('parsha-hashavua');
  const i = zmanim.getParshaOfTheWeek();
  const m = zmanJS.getHebrewDate();
  parsha.value = i;
  parsha.innerHTML = `Parshat ${i}<br><span class='text-s'>${m}</span>`;
  parsha.addEventListener('click',() => {
    const p = tnk.parshiot.find(p => Object.keys(p)[0] === i);
    if (p){
      const [sefer,perek,pasuk] = p[i].split(/[:;.-]/).map(x => parseInt(x));
      tnk.sefer = sefer;
      tnk.perek = perek;
      tnk.pasuk = pasuk;
      populateSefer();
      refresh();
    }
  });
});

document.getElementById('nav-home').addEventListener('click',() => {
  tnk.sefer = 0;
  tnk.perek = 1;
  tnk.pasuk = 1;
  refresh();
});


function search(){
  const box = document.getElementById('pan-search');
  box.style.display = 'block';
}

const panSearch = document.getElementById('pan-search');

const selSefer = document.getElementById('sel-sefer');
const selPerek = document.getElementById('sel-perek');
const selPasuk = document.getElementById('sel-pasuk');

const selParsha = document.getElementById('sel-parsha');
selParsha.addEventListener('change',() => {
  const p = tnk.parshiot.find(p => Object.keys(p)[0] === selParsha.value);
  if (p){
    const [sefer,perek,pasuk] = p[selParsha.value].split(/[:;.-]/).map(x => parseInt(x));
    tnk.sefer = sefer;
    tnk.perek = perek;
    tnk.pasuk = pasuk;
    populateSefer();
  }
});

const btnGo = document.getElementById('pan-go');
btnGo.addEventListener('click',() => {
  refresh();
  panSearch.style.display = 'none';
});

populateParshiot();

function populateParshiot(){
  tnk.parshiot.forEach(p => {
    const name = Object.keys(p)[0];
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    selParsha.add(option);
  });
}

function populateSefer(){
  selSefer.innerHTML = '';
  tnk.seferim.forEach((s,i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = s;
    selSefer.add(option);
  });
  selSefer.value = tnk.sefer;
  populatePerek();
}

function populatePerek(){
  selPerek.innerHTML = '';
  const numPerekim = tnk.psukim[tnk.sefer].length;
  for (let i=1; i<=numPerekim; i++){
    const option = document.createElement('option');
    option.value = i;
    option.text = i;
    selPerek.add(option);
  }
  selPerek.value = tnk.perek;
  populatePasuk();
}

function populatePasuk(){
  selPasuk.innerHTML = '';
  const numPsukim = tnk.psukim[tnk.sefer][tnk.perek-1][0];
  for (let i=1; i<=numPsukim; i++){
    const option = document.createElement('option');
    option.value = i;
    option.text = i;
    selPasuk.add(option);
  }
  selPasuk.value = tnk.pasuk;
}

selSefer.addEventListener('change',() => {
  tnk.sefer = parseInt(selSefer.value);
  tnk.perek = 1;
  tnk.pasuk = 1;
  populatePerek();
});

selPerek.addEventListener('change',() => {
  tnk.perek = parseInt(selPerek.value);
  tnk.pasuk = 1;
  populatePasuk();
});

selPasuk.addEventListener('change',() => {
  tnk.pasuk = parseInt(selPasuk.value);
});

populateSefer();

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api




/*
function _downloadData(ref){
  let url = `https://www.sefaria.org/api/v3/texts/${ref}?version=source`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};
  fetch(url, options).then(res => res.json()).then(json => {
      loadData(json, 'heb-content', 'source');
      tnk.setText(json.versions[0].text);
      url = `https://www.sefaria.org/api/v3/texts/${ref}?version=${tnk.transLang}`;
      fetch(url, options).then(res => res.json()).then(json => {
        loadData(json, 'eng-content', tnk.transLang);
        tnk.transl = json.versions[0].text;
        saveCache();
      });
    }).catch(err => console.error(err));
}

function _fetchData(ref,id,lang){
  const url = `https://www.sefaria.org/api/v3/texts/${ref}?version=${lang}`;
  //const url = `https://www.sefaria.org/api/texts/${ref}?lang=${lang}`;
  const options = {method: 'GET', headers: {accept: 'application/json'}};
  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      loadData(json,id,lang)
    }).catch(err => console.error(err));
}

function _loadData(data,id,lang){
  if (data && data.versions && data.versions[0] && data.versions[0].text){
    let text = data.versions[0].text;
    text = text.replace(/{.*}/g,(match) => `<sup><small><small>${match}</small></small></sup>`);
    if (lang === 'source'){
      tnk.setText(text);
      text = tnk.getText();
    } else {
      tnk.transl = text;
    }
    const e = document.getElementById(id);
    e.innerHTML = text;
  }
}

function _upd(ref){
  document.getElementById('verse2').innerText = ref;
  if (cache && cache[ref]){
    tnk.transl = cache[ref].transl;
    tnk.setText(cache[ref].heb);
    const t = tnk.getText();
    document.getElementById('heb-content').innerHTML = t;
    document.getElementById('eng-content').innerHTML = tnk.transl;
    refId.innerText = ref;
    return;
  }
  downloadData(ref);
  refId.innerText = ref;
}

function _saveCache(){
  if (cache){
    cache[ref] = {"heb": tnk.text[0], "transl": tnk.transl};
    localStorage.setItem("tnk", JSON.stringify(cache));
  }
}

function _refresh2(){
  tnk.book = tnk.seferim[tnk.sefer];
  tnk.ref = `${tnk.book} ${tnk.perek}.${tnk.pasuk}`;
  i.innerText = tnk.ref;
  rf.innerText = tnk.ref;
  upd(tnk.ref);
}

let cache = null;
if (window.localStorage){
  const c = window.localStorage.getItem('tnk');
  cache = c ? JSON.parse(c) : {};
}
*/