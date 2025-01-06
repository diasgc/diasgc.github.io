
if (false && "serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/tl/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

if (!document.fullscreenElement) {
  document.documentElement.requestFullscreen();
} else if (document.exitFullscreen) {
  document.exitFullscreen();
}

/*

{ 
  "aspectRatio": { "max": 1280, "min": 0.001388888888888889 },
  "brightness": { "max": 255, "min": 0, "step": 1 },
  "colorTemperature": { "max": 6500, "min": 2800, "step": 1 },
  "contrast": { "max": 255, "min": 0, "step": 1 },
  "deviceId": "97999776491fff5a18c4cde42a1a8329775eee6c8a4bd74b7ccb68e711a247c4",
  "exposureMode": [ "manual", "continuous" ],
  "exposureTime": { "max": 2500, "min": 10, "step": 1 },
  "facingMode": [], "frameRate": { "max": 30, "min": 0 },
  "groupId": "ed5ea88c24482a6c231c12db068a292529549198648fab2a333e0c2dffc302f6",
  "height": { "max": 720, "min": 1 },
  "resizeMode": [ "none", "crop-and-scale" ],
  "saturation": { "max": 100, "min": 0, "step": 1 },
  "sharpness": { "max": 7, "min": 0, "step": 1 },
  "whiteBalanceMode": [ "manual", "continuous" ],
  "width": { "max": 1280, "min": 1 }
}
*/
/*
aspectRatio
brightness
colorTemperature
contrast
displaySurface
exposureCompensation
exposureMode
exposureTime
facingMode
focusDistance
focusMode
frameRate
height
iso
pointsOfInterest
resizeMode
saturation
sharpness
tilt
torch
whiteBalanceMode
width
zoom
*/

const log = {
  id: document.getElementById('log'),
  i: function(msg){
    console.log(msg);
    if (this.id)
      this.id.innerText += `i: ${msg}\n`;
  },
  clear: function() {
    this.id.innerText = '';
  },
  toggle: function() {
    this.id.style.display = this.id.style.display == 'none' ? 'block' : 'none';
  }
}

const video = {
  id: document.getElementById('tl-video'),
  stream: null,
  track: null,
  caps: null,
  opts: {
    width: window.innerWidth,
    height: window.innerHeight,
    facingMode: {ideal:"environment"},
    resizeMode: "crop-and-scale",
  },
  load: function(s){
    this.stream = s;
    this.track = s.getVideoTracks()[0]
    this.caps = this.track.getCapabilities();
    this.opts.width = this.caps.width.max;
    this.opts.height = this.caps.height.max;
    this.track.applyConstraints(this.opts);
    this.id.srcObject = this.stream;
    this.id.play();
  }
}

const tableCaps = {
  id: document.getElementById('table-caps'),
  th: document.getElementById('thead'),
  td: document.getElementById('tdata'),
  aspectRatio: {
    abr: "ar",
    def: "1",
    fmt: (c) => parseFloat(c).toFixed(1) },
  brightness: {
    abr: "bri",
    def: "0" },
  colorTemperature: {
    abr: "TKº",
    def: "5000",
    fmt: (c) => c+"ºK" },
  contrast: { 
    abr: "ctr",
    def: "0" },
  exposureCompensation: { 
    abr: "expC",
    def: "0",
    fmt: (c) => parseFloat(c).toFixed(1) },
  exposureMode: { 
    abr: "expM",
    def: "manual",
    fmt: (c) => c.substring(0,3) },
  exposureTime: {
    abr: "expT",
    def: "500",
    fmt: (c) => c+"ms" },
  facingMode: { 
    abr: "cam",
    def: "environment",
    fmt: (c) => c.substring(0,3) },
  focusDistance: { 
    abr: "foc",
    def: "max",
    fmt: (c) => parseFloat(c).toFixed(1) },
  focusMode: { 
    abr: "focM",
    def: "manual",
    fmt: (c) => c.substring(0,3) },
  frameRate: { 
    abr: "fps",
    def: "0",
    fmt: (c) => parseFloat(c).toFixed(1) },
  iso: { 
    abr: "iso",
    def: "100" },
  resizeMode: { 
    abr: "rm",
    def: "none",
    fmt: (c) => c === 'none' ? '-' : 'crop' },
  saturation: { 
    abr: "sat",
    def: "0" },
  sharpness: { 
    abr: "shp",
    def: "0" },
  tilt: {
    abr: "tilt",
    def: "0"},
  torch: {
    abr: "flsh",
    def: "false",
    fmt: (c) => c === 'false' ? 'off' : 'on' },
  whiteBalanceMode: { 
    abr: "wb",
    def: "manual",
    fmt: (c) => c.substring(0,3) },
  zoom: { 
    abr: "zoom",
    def: "1",
    fmt: (c) => c+"x" },
  debug: {
    abr: "dbg",
    def: false,
    fmt: (c) => c+"x",
    btn: () => log.toggle()
  },
  load: function(caps){
    this.th.replaceChildren();
    this.td.replaceChildren();
    let th = document.createElement('tr');
    let tb = document.createElement('tr');
    Object.keys(caps).forEach(key => {
      if (this[key]){
        this.setItem(th, key, tb, this.getVal(caps,key));
        //let h = document.createElement('th');
        //h.id = key;
        //h.innerHTML = this[key].abr;
        //let d = document.createElement('td');
        //d.innerHTML = this.getVal(caps,key);
        
      }
    });
    this.setItem(th, 'debug', tb, true);
    this.th.appendChild(th);
    this.td.appendChild(tb);
  },
  setItem: function(th, key, tb, val){
    let h = document.createElement('th');
    h.id = key;
    h.innerHTML = this[key].abr;
    th.appendChild(h);
    let d = document.createElement('td');
    d.innerHTML = val;
    if (this[key].btn)
      d.addEventListener('click', this[key].btn);
    tb.appendChild(d);
  },
  getVal: function(caps, key){
    if (this[key]){
      let def = this[key].def;
      if (def === 'max')
        def = caps[key].max;
      else if (def === 'min')
        def = caps[key].min;
      return this[key].fmt ? this[key].fmt(def) : def;
    }
    return "-";
  }
}

let track;
let stream;

navigator.mediaDevices
  .getUserMedia({ video: video.opts, audio: false })
  .then((stream) => init(stream))
  .catch((err) => {
    log.innerText = `An error occurred: ${err}`;
  });

function init(stream) {
  video.load(stream);
  //log.innerText = JSON.stringify(video.caps, null, 2);
  tableCaps.load(video.caps);
}

screen.orientation.addEventListener("change", (event) => {
  const type = event.target.type;
  const angle = event.target.angle;
  log.i(`ScreenOrientation change: ${type}, ${angle} degrees.`);
});

var lastOrientation;
window.addEventListener("deviceorientation", function(e){
  let newOrientation = Math.abs(e.gamma) ? "portrait" : "landscape";
  if (newOrientation !== lastOrientation)
    log.i((lastOrientation = newOrientation));
});


/* Xiaomi
{
"aspectRatio": {
"max": 4000,
"min": 0.0003333333333333333
},
"colorTemperature": {
"max": 7000,
"min": 2850,
"step": 50
},
"deviceId": "e1a3fb554171efcc3893c6605137c8251c0fcd748cc60c93ed95153d169ae88d",
"exposureCompensation": {
"max": 4,
"min": -4,
"step": 0.1666666716337204
},
"exposureMode": [
"continuous",
"manual"
],
"exposureTime": {
"max": 10000,
"min": 0.56,
"step": 0.1
},
"facingMode": [
"environment"
],
"focusDistance": {
"max": 14.498610496520996,
"min": 0.10000000149011612,
"step": 0.009999999776482582
},
"focusMode": [
"manual",
"single-shot",
"continuous"
],
"frameRate": {
"max": 30,
"min": 0
},
"groupId": "ca703f8129f2a224c1430464a1441e51cd5684d34dbed09c27df4a16a1fe9ffe",
"height": {
"max": 3000,
"min": 1
},
"iso": {
"max": 2000,
"min": 50,
"step": 1
},
"resizeMode": [
"none",
"crop-and-scale"
],
"torch": true,
"whiteBalanceMode": [
"continuous",
"manual"
],
"width": {
"max": 4000,
"min": 1
},
"zoom": {
"max": 10,
"min": 1,
"step": 0.1
}
}
*/