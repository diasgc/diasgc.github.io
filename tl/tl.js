const video = document.getElementById('tl-video');
const canvas = document.getElementById('tl-canvas');
const elapsed = document.getElementById('elapsed');

var filename;
var rec;
var timer;
var ctx;
var t0;

const log = {
  id: document.getElementById('log'),
  msg: function(msg){
    this.id.innerText += `${msg}\n`;
  }
}

const videoOpts = {
  facingMode: {ideal: "environment"},
  resizeMode: "crop-and-scale"
}

const recorder = {
  mediaRecorder: null,
  filename: null,

}

const stream = {
  stream: null,
  track: null,
  caps: null,
  init: function(stream){
    this.stream = stream;
    this.track = stream.getVideoTracks()[0];
    this.caps = this.track.getCapabilities();
    settings.init(this.caps);
  }
}

const input = {
  panel: document.getElementById('panel-input'),
  title: document.getElementById('input-title'),
  value: document.getElementById('input-value'),
  ruler: document.getElementById('input-ruler'),
  show: function(key){
    this.panel.style.display = 'inline';
    let cap = stream.caps[key];
    this.title.innerText = key;
    this.value.innerText = "0";
    if (Array.isArray(cap)){

    } else if (cap.max !== 'null' && cap.min !== 'null' && cap.step !== 'null'){
      this.ruler.replaceChildren();
      createRuler(this.ruler,(v) => {
        this.value.innerText = v.toFixed(0);
      },{
        color: '#fff',
        min: cap.min,
        max: cap.max
      })
    }
  },
  hide: function(){
    this.panel.style.display = 'none';
  }
}

const settings = {
  id: document.getElementById('table-caps'),
  th: document.getElementById('thead'),
  td: document.getElementById('tdata'),
  aspectRatio: {
    abr: "AR",
    def: "1",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
    btn: () => input.show("aspectRatio", (v) => settings.apply('aspectRatio', v))
  },
  brightness: {
    abr: "Br",
    def: "0",
    type: "int",
    btn: () => input.show("brightness", (v) => settings.apply('brightness', v))
  },
  colorTemperature: {
    abr: "T°K;",
    def: "5000",
    type: "int",
    fmt: (c) => c + "°K",
    btn: () => input.show("colorTemperature", (v) => settings.apply('colorTemperature', v))
  },
  contrast: { 
    abr: "Cnt",
    def: "0",
    type: "int",
    btn: () => input.show("contrast", (v) => settings.apply('contrast', v))
  },
  exposureCompensation: { 
    abr: "E&pm;",
    def: "0",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
    btn: () => input.show('exposureCompensation', (v) => settings.apply('exposureCompensation', v))
  },
  exposureMode: { 
    abr: "EM",
    def: "manual",
    type: "str",
    fmt: (c) => c.substring(0,3),
    btn: () => input.show("exposureMode", (v) => settings.apply('exposureMode', v))
  },
  exposureTime: {
    abr: "Exp",
    def: "500",
    type: "long",
    fmt: (c) => c > 1000 ? parseFloat(c/1000).toFixed(1) + "s" : parseFloat(c).toFixed(1) + "ms",
    btn: () => input.show("exposureTime", (v) => settings.apply('exposureTime', v))
  },
  facingMode: { 
    abr: "CAM",
    def: "environment",
    type: "str",
    fmt: (c) => c.substring(0,3),
    btn: () => input.show("facingMode", (v) => settings.apply('facingMode', v))
  },
  focusDistance: { 
    abr: "FOC",
    def: "max",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
    btn: () => input.show("focusDistance", (v) => settings.apply('focusDistance', v))
  },
  focusMode: { 
    abr: "FocM",
    def: "manual",
    type: "str",
    fmt: (c) => c.substring(0,3),
    btn: () => input.show("focusMode", (v) => settings.apply('focusMode', v))
  },
  frameRate: { 
    abr: "FPS",
    def: "0",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
    btn: () => input.show("frameRate", (v) => settings.apply('frameRate', v))
  },
  iso: { 
    abr: "ISO",
    def: "100",
    type: "int",
    btn: () => input.show("iso", (v) => settings.apply('iso', v))
  },
  resizeMode: { 
    abr: "Crop",
    def: "none",
    type: "str",
    idx: 0,
    fmt: (c) => c === 'none' ? 'def' : 'crop',
  },
  saturation: { 
    abr: "SAT",
    def: "0",
    btn: () => input.show("saturation", (v) => settings.apply('saturation', v))
  },
  sharpness: { 
    abr: "SHRP",
    def: "0",
    type: "int",
    btn: () => input.show("sharpness", (v) => settings.apply('sharpness', v))},
  tilt: {
    abr: "TILT",
    def: "0"},
  torch: {
    abr: "FLSH",
    def: "false",
    fmt: (c) => c === 'false' ? 'off' : 'on' },
  whiteBalanceMode: { 
    abr: "WB",
    def: "manual",
    type: "str",
    fmt: (c) => c.substring(0,3),
    btn: () => input.show("whiteBalanceMode", (v) => settings.apply('whiteBalanceMode', v))
  },
  zoom: { 
    abr: "zoom",
    def: "1",
    type: "int",
    fmt: (c) => c+"x",
    btn: () => input.show("zoom", (v) => settings.apply('zoom', v))
  },
  debug: {
    abr: "dbg",
    def: false,
    type: "bool",
    fmt: (c) => c+"x",
    btn: () => log.toggle()
  },
  init: function(caps){
    this.th.replaceChildren();
    this.td.replaceChildren();
    Object.keys(caps).forEach(key => {
      if (this[key]) this.insertCap(key);
    });
    //this.setItem(th, 'debug', tb, true);
  },
  insertCap: function(key){
    let h = document.createElement('th');
    h.innerHTML = this[key].abr;
    let d = document.createElement('td');
    d.id = "td-" + key;
    d.innerHTML = "def";
    d.onclick = (e) => input.show(key);
    this.th.appendChild(h);
    this.td.appendChild(d);
  }
}

function startStop(){
  if (video.style.display !== 'none'){
    filename = getTimestampFilename()+".webm";
    t0 = Date.now();
    //timer = setInterval(capture, 1000)
  } else {
    clearInterval(timer);
  }
}

function getTimestampFilename(){
  return "tl-" + new Date(Date.now())
    .toISOString()
    .slice(0, 19)
    .replace(/-|:/g,'')
    .replace(/T/g,'-');
}

function saveBlob(blob){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function init(s){
  window.stream = s;
  video.srcObject = s;
  video.play();
  stream.init(s);
}

input.hide();

navigator.mediaDevices
  .getUserMedia({ video: videoOpts, audio: false })
  .then((stream) => init(stream));

window.onclick = function(event) {
  if (event.target === input.panel)
    input.hide();
}