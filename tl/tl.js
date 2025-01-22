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

function capture(){
  let elapsed = Date.now() - recorder.startTime;
  recorder.elapsId.innerHTML = new Date(elapsed).toISOString().slice(11, 19);
}

const timeLapseMs = 1000.0/30.0*90.0;

const videoOpts = {
  facingMode: {ideal: "environment"},
  resizeMode: "crop-and-scale",
  frameRate: 30.0
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
  speed: 30,
  fcount: 0,
  isRecording: false,
  opts: {
    //mimeType: "video/webm; codecs=vp9",
    mimeType: "video/mp4;codecs=avc1"
  },
  getTimestampFilename: function(){
    let ext = this.opts.mimeType.split(';')[0].split('/')[1];
    let ret = "tl-" + new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g,'')
      .replace(/T/g,'-');
    return `${ret}.${ext}`;
  },
  capture: function(){
    if (recorder.mediaRecorder.state === 'paused'){
      recorder.mediaRecorder.resume();
      recorder.mediaRecorder.requestData();
    }
  },
  startCapture: function(stream, frameMillis){
    this.frameMillis = frameMillis;
    this.mediaRecorder = new MediaRecorder(stream, this.opts);
    this.mediaRecorder.ondataavailable = event => this.ondataavailable(event);
    this.mediaRecorder.start(frameMillis);
    //this.mediaRecorder.pause();
    this.isRecording = true;
    //setTimeout(recorder.capture, frameMillis);
  },
  start: function(){
    this.startTime = Date.now();
    this.fcount = 0;
    this.filename = this.getTimestampFilename();
    videoOpts.frameRate = this.fps / this.speed;
    let frameMillis = 1000.0 / videoOpts.frameRate;
    stream.reset(stream => {
        recorder.startCapture(stream, frameMillis);
        video.srcObject = stream;
      }
    );
  },
  ondataavailable: function(event){
    if (event.data.size === 0)
      return;
    //this.mediaRecorder.pause();
    //setTimeout(recorder.capture, recorder.frameMillis);
    this.fcount++;
    this.dataSize += event.data.size;
    this.data.push(event.data);
    this.statsId.innerHTML = `video: ${this.dataSize.strSI('B')} frame: ${event.data.size.strSI('B')} frames: ${this.fcount}`;
  },
  update: function(){
    let elapsed = Date.now() - this.startTime;
    this.elapsId.innerHTML = new Date(elapsed).toISOString().slice(11, 19);
    this.timerId.innerHTML = new Date(this.fcount / this.fps * 1000).toISOString().slice(11, 19);
  },
  stop: function(){
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.resetViews();
    if (this.data !== null && this.data.length > 0)
      this.save();
  },
  resetViews: function(){
    this.elapsId.innerHTML = '00:00:00';
    this.statsId.innerHTML = 'idle';
    this.timerId.innerHTML = '00:00:00';
  },
  save: function(){
    timelapse(recorder.data, 30.0, function(blob){
      //let blob = new Blob(data, { type: recorder.opts.mimeType });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = recorder.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
   });
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
  reset: function(onStream){
    navigator.mediaDevices
      .getUserMedia({ video: videoOpts, audio: false })
      .then((s) => {
        stream.init(s, video);
        onStream(s);
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
    const scap = settings[key];
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
        max: cap.max,
        step: scap.step || cap.step
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
    step: 10,
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
    step: 10,
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
      d.innerHTML = settings[key].fmt
        ? settings[key].fmt(v)
        : settings.type === 'float'
          ? v.toFixed(1)
          : settings.type === 'str'
            ? v.substring(0,3)
            : v;
      if (stream[key]){
        videoOpts[key] = v;
        stream.reset(s => video.srcObject = s)
      }
    });
    this.th.appendChild(h);
    this.td.appendChild(d);
  }
}

function startStop(){
  if (!recorder.isRecording){
    timer = setInterval(recorder.update.bind(recorder), 1000)
    recorder.start();
  } else {
    clearInterval(timer);
    recorder.stop();
  }
}

stream.reset(stream => {
  video.srcObject = stream;
  video.play();
});

window.onclick = function(event) {
  if (event.target === input.panel){
    input.dismiss();
  }
    
}