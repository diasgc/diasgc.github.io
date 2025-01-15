Number.prototype.strSI = function(unit, fixed=2, mul=1024){
  const sfx = ['', 'K', 'M', 'G', 'T'];
  let i = 0;
  let v = this;
  while (v >= mul && i++ < 4)
    v /= 1024;
  return `${v.toFixed(fixed)} ${sfx[i]}${unit}`;
}

const video = document.getElementById('tl-video');

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
  timerId: document.getElementById('timer'),
  elapsId: document.getElementById('elapsed'),
  statsId: document.getElementById('stats'),
  mediaRecorder: null,
  filename: null,
  data: [],
  dataSize: 0,
  startTime: 0,
  fps: 30.0,
  speed: 90,
  opts: {
    mimeType: "video/webm; codecs=vp9"
  },
  start: function(){
    this.mediaRecorder = new MediaRecorder(stream.stream, this.opts);
    this.startTime = Date.now();
    this.mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0){
        fcount++;
        recorder.dataSize += event.data.size;
        recorder.statsId.innerHTML = `video: ${recorder.dataSize.strSI('B')} frame: ${event.data.size.strSI('B')} frames: ${fcount}`;
        recorder.data.push(event.data);
      }
    };
    this.mediaRecorder.onstop = () => {
      this.isRunning = false;
      clearInterval(t);
      recorder.timerId.style.opacity = 0.015625;
      recorder.timerId.innerText="00:00:00";
      if (recorder.data !== null && recorder.data.length > 0)
        recorder.save();
    }
    this.mediaRecorder.start(2000);
  }
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
  },
  reset: function(callback){
    navigator.mediaDevices
      .getUserMedia({ video: videoOpts, audio: false })
      .then((s) => {
        stream.init(s);
        callback(s);
      });
  }
}

const input = {
  panel: document.getElementById('panel-set'),
  title: document.getElementById('input-title'),
  value: document.getElementById('input-value'),
  ruler: document.getElementById('input-ruler'),
  tgVal: null,
  callback: null,
  show: function(key, callback){
    input.callback = callback;
    this.panel.style.display = 'inline';
    const cap = stream.caps[key];
    this.title.innerText = key;
    this.value.innerText = "0";
    if (Array.isArray(cap)){

    } else if (cap.max !== 'null' && cap.min !== 'null' && cap.step !== 'null'){
      this.ruler.replaceChildren();
      createRuler(this.ruler,(v) => {
        this.value.innerText = v.toFixed(0);
        input.tgVal = v;
      },{
        color: '#fff',
        min: cap.min,
        max: cap.max
      })
    }
  },
  dismiss: function(){
    if (this.callback !== null && this.tgVal !== null){
      this.callback(this.tgVal);
      this.callback = null;
      this.tgVal = null;
    }
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
  },
  brightness: {
    abr: "Br",
    def: "0",
    type: "int",
  },
  colorTemperature: {
    abr: "T°K;",
    def: "5000",
    type: "int",
    fmt: (c) => c + "°K",
  },
  contrast: { 
    abr: "Cnt",
    def: "0",
    type: "int",
  },
  exposureCompensation: { 
    abr: "E&pm;",
    def: "0",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
  },
  exposureMode: { 
    abr: "EM",
    def: "manual",
    type: "str",
    fmt: (c) => c.substring(0,3),
  },
  exposureTime: {
    abr: "Exp",
    def: "500",
    type: "long",
    fmt: (c) => c > 1000 ? parseFloat(c/1000).toFixed(1) + "s" : parseFloat(c).toFixed(1) + "ms",
  },
  facingMode: { 
    abr: "CAM",
    def: "environment",
    type: "str",
    fmt: (c) => c.substring(0,3),
  },
  focusDistance: { 
    abr: "FOC",
    def: "max",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
  },
  focusMode: { 
    abr: "FocM",
    def: "manual",
    type: "str",
    fmt: (c) => c.substring(0,3),
  },
  frameRate: { 
    abr: "FPS",
    def: "0",
    type: "float",
    fmt: (c) => parseFloat(c).toFixed(1),
  },
  iso: { 
    abr: "ISO",
    def: "100",
    type: "int",
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
  },
  sharpness: { 
    abr: "SHRP",
    def: "0",
    type: "int",
  },
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
  },
  zoom: { 
    abr: "zoom",
    def: "1",
    type: "int",
    fmt: (c) => c+"x",
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
    const d = document.createElement('td');
    d.id = "td-" + key;
    d.innerHTML = "def";
    d.onclick = (e) => input.show(key, v => {
      d.innerHTML = settings[key].fmt ? settings[key].fmt(v) : v;
      if (stream[key])
        videoOpts[key] = v;
    });
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
  //window.stream = s;
  video.srcObject = s;
  video.play();
  //stream.init(s);
}

stream.reset(stream => init(stream));

window.onclick = function(event) {
  if (event.target === input.panel){
    input.dismiss();
  }
    
}