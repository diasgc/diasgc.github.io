Number.prototype.strSI = function(unit, fixed=2, mul=1024){
  const sfx = ['', 'K', 'M', 'G', 'T'];
  let i = 0;
  let v = this;
  while (v >= mul && i++ < 4)
    v /= 1024;
  return `${v.toFixed(fixed)} ${sfx[i]}${unit}`;
}

const touchEvent = 'click'; //'ontouchstart' in window ? 'touchstart' : 'click';
const divMain = document.getElementById('div-main');
const startStopButton = document.getElementById('startStop');
const micButton = document.getElementById('startStop');
const { createFFmpeg, fetchFile } = FFmpeg;
const urlParams = new URLSearchParams(window.location.search);
const useFFmpeg = urlParams.get('ffmpeg') !== null;

startStopButton.onchange = startStop;
document.getElementById('rec-mc0').onchange = rmic;
document.getElementById('rec-mc1').onchange = rmic;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/arec-b/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const logger = {
  id: document.getElementById('log-stat'),
  dataSize: 0,
  log: function(msg){
    this.id.innerText = msg;
  },
  addSize: function(size){
    this.dataSize += size;
  }
}

const graph2 = {
  container: document.getElementById('graph'),
  canvasSize: '',
  fftSize: 256,
  centered: true,
  ctx: '',
  audioContext: '',
  source: '',
  analyser: '',
  init: function(){
    let canvas = document.getElementById('canvas');
    this.canvasSize = { width: canvas.width, height: canvas.height}
    this.ctx = canvas.getContext("2d");
    const body = window.getComputedStyle(document.body, null);
    this.ctx.fillStyle = body.backgroundColor;
    this.ctx.strokeStyle = body.accentColor;
    this.ctx.lineCap = "round";
  },
  start: function(stream){
    this.container.style.display = 'flex';
    this.audioContext = new(window.AudioContext || window.webkitAudioContext);
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.fftSize = this.fftSize;
    this.buffLen = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.buffLen);
    this.barWidth = (500 - 2 * this.buffLen - 4) / this.buffLen * 2.5;
    this.ctx.lineWidth = graph2.barWidth;
    this.isEnabled = true;
    this.draw();
  },
  stop: function(){
    this.isEnabled = false;
    this.container.style.display = 'none';
    this.audioContext.close;
    this.source.disconnect;
    
  },
  draw: function(){
    graph2.ctx.fillRect(0, 0, graph2.canvasSize.width, graph2.canvasSize.height);
    if (graph2.isEnabled){
      graph2.analyser.getByteFrequencyData(graph2.dataArray);
      const ay = graph2.canvasSize.height - graph2.barWidth / 2;
      if (graph2.centered){
        var kx, ky = ay / 2, dy;
        for (var i = 0; i < graph2.buffLen; i++) {
          kx = 4 + 2 * i * graph2.barWidth + graph2.barWidth / 2;
          dy = graph2.dataArray[i] * 0.25;
          graph2.ctx.beginPath();
          graph2.ctx.moveTo(kx, ky + dy);
          graph2.ctx.lineTo(kx, ky - dy);
          graph2.ctx.stroke();
        }
      } else {
        var kx, ky = ay, dy;
        for (var i = 0; i < graph2.buffLen; i++) {
          kx = 4 + 2 * i * graph2.barWidth + graph2.barWidth / 2;
          dy = graph2.dataArray[i] * 0.5;
          graph2.ctx.beginPath();
          graph2.ctx.moveTo(kx, ky);
          graph2.ctx.lineTo(kx, ky - dy);
          graph2.ctx.stroke();
        }
      }
      requestAnimationFrame(graph2.draw);
    }
  }

}

const timer = {
  id: document.getElementById('timer'),
  startTime: 0,
  timerInterval: '',
  start: function(){
    this.startTime = Date.now();
    this.timerInterval = setInterval(timer.update.bind(timer), 1000);
  },
  update: function(){
    const elapsedTime = Date.now() - this.startTime;
    this.id.innerText = new Date(elapsedTime).toISOString().slice(11, 19);
    if (elapsedTime > outputCtl.timeout)
      document.getElementById('startStop').click();
  },
  stop: function(){
    this.timerInterval = clearInterval(timer.timerInterval);
    this.id.innerText = "00:00:00";
  }
}

const session = {
  audio: true
}

function rmic(){
  if (micCtl.micOn.checked){
    divMain.disabled = false;
    divMain.style.opacity = 1;
    navigator.mediaDevices.getUserMedia(session);
    startStopButton.disabled = false;
  } else {
    divMain.disabled = true;
    divMain.style.opacity = 0.1;
    startStopButton.disabled = true;
    if (stream && stream.getTracks())
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      }
    );
  }
  
}

const fsBuilder = {
  build: function(type, fs, options, opt){
    let fieldset = document.createElement('fieldset');
    fieldset.className = "fs-setup";
    let legend = document.createElement('legend');
    legend.innerText = fs.name;
    fieldset.appendChild(legend);
    Object.keys(fs.entries).forEach(function (key) {
      let input = document.createElement('input');
      let val = fs.entries[key];
      if(key.includes('*')){
        input.checked = true;
        key = key.replace('*', '');
      }
      let id = fs.name.substring(0,2) + "-" + key;
      input.type = type;
      input.id = id;
      input.name = fs.name;
      input.value = val;
      input.addEventListener('change', function(){
        options[opt] = val;
      });
      let label = document.createElement('label');
      label.setAttribute("for", id);
      label.innerText = key;
      fieldset.appendChild(input);
      fieldset.appendChild(label);  
    });
    return fieldset;
  }
}

const inputCtl = {
  fsi: document.getElementById('fs-input'),
  isCollapsed: true,
  summary: document.getElementById('fs-input-summary'),
  audioConstraints: [ 'deviceId', 'channelCount', 'sampleSize', 'sampleRate','autoGainControl', 'echoCancellation', 'latency', 'noiseSuppression', 'pan', 'suppressLocalAudioPlayback','voiceIsolation' ],
  supportedConstraints: {},

  deviceId:         { name: "source", lab: "src ", sfx: "", entries: {} },
  channelCount:     { name: "channels", lab: "", sfx: "", entries: { "mono": "1", "stereo*": "2" } },
  sampleSize:       { name: "bits", lab: "", sfx: "-bits", entries: { "8": "8", "16*": "16", "24": "24" } },
  sampleRate:       { name: "samplerate", lab: "", sfx: "Hz", entries: {"8k": "8000", "11k": "11025", "44k": "44100", "48k*": "48000", "96k": "96000" } },
  autoGainControl:  { name: "agc", lab: "agc ", sfx: "", entries: { "off": "false", "on*": "true" } },
  noiseSuppression: { name: "noise", lab: "nr ", sfx: "", entries: { "off*": "false", "on": "true" } },
  echoCancellation: { name: "echo", lab: "echo ", sfx: "", entries: { "off*": "false", "on": "true" } },
  voiceIsolation:   { name: "voice", lab: "voice ", sfx: "", entries: { "off*": "false", "on": "true" } },
  suppressLocalAudioPlayback: { name: "local ", lab: "local ", sfx: "", entries: { "off*": "false", "on": "true" } },
  
  options: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
    voiceIsolation: false,
    suppressLocalAudioPlayback: false,
    sampleRate: 48000,
    channelCount: 2,
    volume: 1.0,
    sampleSize: 16,
    latency: 0
  },

  toggleView: function(){
    if (inputCtl.isCollapsed)
      inputCtl.expand();
    else
      inputCtl.collapse();
  },

  collapse: function(){
    this.isCollapsed = true;
    this.fsi.querySelectorAll('fieldset.fs-setup').forEach(el => {
      el.classList.replace('fs-setup','fs-setup-d')
    });
  },

  expand: function(){
    this.isCollapsed = false;
    this.fsi.querySelectorAll('fieldset.fs-setup-d').forEach(el => {
      el.classList.replace('fs-setup-d','fs-setup')
    });
  },

  setDisabled: function(state){
    document.getElementById('fsi').disabled = state;
  },

  labelForValue: function(field, val){
    let ret = Object.keys(field).find(key => field[key] === val) || val;
    return ret.replace('*','');
  },

  init: function(){
    let fs = document.getElementById('fsi');
    fs.addEventListener(touchEvent, this.toggleView);
    this.fsi.replaceChildren();
    this.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    Object.keys(this.supportedConstraints).forEach((key) => {
      if (this[key] === 'undefined')
        delete this.supportedConstraints[key];
    });
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          if (device.kind === 'audioinput'){
            let lab = device.label.substring(0,7) + (device.deviceId === 'default' ? "*" : "");
            this.deviceId.entries[lab] = device.deviceId;
          }
        });
        this.audioConstraints.forEach(constraint => {
          if (this[constraint] && JSON.stringify(this[constraint].entries).length > 8 )
            this.fsi.appendChild(fsBuilder.build("radio", this[constraint], this.options, constraint));
        });
        this.collapse();
      });
  },
  getOptions: function(){
    return this.options;
    let out = JSON.stringify(this.options, (k,v) => {
      return v === 'true' ? true : v === 'false' ? false : parseInt(v) || v; 
    });
    out = JSON.parse(out);
    //logger.log(JSON.stringify(out));
    return out;
  },
}

const outputCtl = {
  fsi: document.getElementById('fs-output'),
  isCollapsed: true,
  summary: document.getElementById('fs-output-summary'),
  builtInContainers: [ "webm", "mp4", "ogg" ],
  builtInCodecs: [ "opus", "pcm" ],
  graph: { name: "graph", entries: { "off": "false", "on*": "true"} },
  audioBitsPerSecond: { name: "bitrate", entries: { "32k": "32000", "56k": "56000", "128k": "128000", "192k": "192000", "256k*": "256000", "320k": "320000", "512k": "512000" } },
  audioBitrateMode:   { name: "mode",    entries: { "cbr": "constant", "vbr*": "variable" } },
  cnt: { name: "extension", entries: { "webm": "webm", "mp4*": "mp4" } },
  cod: { name: "codec", entries: { "pcm": "pcm", "opus*": "opus" } },
  timer: { name: "timer", entries: { "off": "0", "1m": "60000", "3m": "180000", "5m*": "300000", "10m": "600000", "20m": "1200000" } },

  mimeType: "audio/mp4",
  transcode: false,
  timeout: 300000,

  options: {
    audioBitsPerSecond : "256000",
    audioBitrateMode : "variable",
    mimeType: "audio/mp4;codecs=opus",
    container: 'mp4',
    codec: 'opus',
    timer: "300000",
    graph: "true"
  },

  setDisabled: function(state){
    document.getElementById('fso').disabled = state;
  },

  toggleView: function(){
    if (outputCtl.isCollapsed)
      outputCtl.expand();
    else
    outputCtl.collapse();
  },

  collapse: function(){
    this.isCollapsed = true;
    this.fsi.querySelectorAll('fieldset.fs-setup').forEach(el => {
      el.classList.replace('fs-setup','fs-setup-d')
    });
  },

  expand: function(){
    this.isCollapsed = false;
    this.fsi.querySelectorAll('fieldset.fs-setup-d').forEach(el => {
      el.classList.replace('fs-setup-d','fs-setup')
    });
  },

  registerEncoder(container, codec){
    this.cnt.entries[container] = container;
    this.cod.entries[codec] = codec;
  },

  readType: function(type){
    let b = type.split(';codecs=');
    let a = b[0].replace('audio/','');
    return { container: a, codec: b[1] };
  },

  setDefault: function(obj, val, callback){
    if (obj[val])
      callback(JSON.parse(JSON.stringify(obj).replace(val+"\":", val+"\*\":")), val);
    else if (Object.entries(obj)[0])
      this.setDefault(obj, Object.keys(obj)[0], callback);
    else
      callback(obj, val);
  },

  init: function(){
    this.loadSupportedTypes();
    this.fsi.replaceChildren();
    if (useFFmpeg)
      this.registerEncoder("flac","flac");
    let fs = document.getElementById('fso');
    fs.addEventListener(touchEvent, this.toggleView);
    this.fsi.appendChild(fsBuilder.build("radio", this.audioBitsPerSecond, this.options, "audioBitsPerSecond"));
    this.fsi.appendChild(fsBuilder.build("radio", this.audioBitrateMode, this.options, "audioBitrateMode"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cnt, this.options, "container"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cod, this.options, "codec"));
    this.fsi.appendChild(fsBuilder.build("radio", this.timer, this.options, "timer"));
    this.fsi.appendChild(fsBuilder.build("radio", this.graph, this.options, "graph"));
    this.collapse();
  },
  
  containersTest: [ 'webm', 'mp4', 'ogg' ], // extended: 'webm', 'mp3', 'mp4', 'x-matroska', 'ogg', 'wav'
  codecsTest: [ 'opus', 'pcm', 'm4a' ], // extended: 'opus', 'vorbis', 'aac', 'mpeg', 'mp4a', 'pcm'
  loadSupportedTypes: function(){
    this.supportedTypes = [];
    this.cnt.entries = {};
    this.cod.entries = {};
    var t;
    this.containersTest.forEach((type) => {
      this.codecsTest.forEach((codec) => {
        if (MediaRecorder.isTypeSupported(t = `audio/${type};codecs=${codec}`)){
          this.supportedTypes.push(t);
          if (this.cnt.entries[String(type)] === undefined)
            this.cnt.entries[String(type)] = type;
          if (this.cod.entries[String(codec)] === undefined)
            this.cod.entries[String(codec)] = codec;
        }
      });
    });
    // set defaults
    let def = this.readType(this.options.mimeType);
    this.setDefault(this.cnt.entries, def.container, (entries, defVal) => {
      this.cnt.entries = entries;
      this.options.mimeType = "audio/" + defVal;
    });
    this.setDefault(this.cod.entries, def.codec, (entries, defVal) => {
      this.cod.entries = entries;
      this.options.mimeType += ";codecs=" + defVal;
    });
    console.log(this.supportedTypes);
  },

  getOptions: function(){
    let opts = JSON.parse(JSON.stringify(this.options));
    this.timeout = parseInt(opts.timer);
    this.mimeType = `audio/${opts.container}`;
    opts.mimeType = `${this.mimeType};codecs=${opts.codec}`;
    if (this.builtInContainers.indexOf(opts.container) < 0){
      //opts.mimeType = "audio/webm;codecs=pcm";
      this.transcode = true;
    }
    delete opts.container;
    delete opts.codec;
    delete opts.timer;
    delete opts.graph;
    return opts;
  }
}

const micCtl = {
  micOn: document.getElementById('rec-mc1')
}

const dataManager = {
  chunks: [],
  chunkTimeout: 2000,
  add: function(data){
    this.chunks.push(data);
    logger.addSize(data.size);
    logger.log(`size: ${logger.dataSize.strSI('B')}`);
  },
  getTimestampFilename() {
    return "rec-" + new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g,'')
      .replace(/T/g,'-');
  },
  save: function() {
    let blob = outputCtl.transcode
      ? this.transcode()
      : new Blob(this.chunks, { type: outputCtl.mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.getTimestampFilename() + "." + outputCtl.options.container.replace('mp4','m4a');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.chunks = [];
    logger.log("idle");
  },
  transcode: async function(){
    logger.log("transcoding...");
    const ffmpeg = createFFmpeg({ log: true });
    //ffmpeg.on('log', e => console.log(e.message));
    //ffmpeg.on('progress', e => console.log(e.progress));
    if (ffmpeg.isLoaded() === false)
      await ffmpeg.load();
    let input = "temp-rec.webm  ";
    let output = "output." + outputCtl.options.container;
    ffmpeg.FS("writeFile", input, await fetchFile(new Blob(this.chunks, { type: outputCtl.mimeType })));
    await ffmpeg.run("-i", input, "-c:a", "copy", output);
    const data = ffmpeg.FS("readFile", output);
    logger.log("size: " + data.buffer.byteLength);
    return new Blob([data.buffer], { type: outputCtl.mimeType });
  }
}

function startStop(){
  if (startStopButton.checked)
    startRecording();
  else
    stopRecording();
}

async function startRecording(){
  inputCtl.collapse();
  inputCtl.setDisabled(true);
  outputCtl.collapse();
  outputCtl.setDisabled(true);
  session.audio = inputCtl.getOptions();
  stream = await navigator.mediaDevices.getUserMedia(session);
  lock = await navigator.wakeLock.request('screen');
  
  recorder = new MediaRecorder(stream, outputCtl.getOptions());
  recorder.start(dataManager.chunkTimeout);
  if (outputCtl.options.graph === 'true')
    graph2.start(stream);
  recorder.addEventListener("dataavailable", async (event) => {
    dataManager.add(event.data);
    if (recorder.state === "inactive")
      dataManager.save();
  });
  timer.start();
  
}

async function stopRecording(){
  // Stop the recording.
  recorder.stop();
  timer.stop();
  if (lock != null){
    await lock.release();
    lock = null;
  }
  inputCtl.setDisabled(false);
  outputCtl.setDisabled(false);
  if (outputCtl.options.graph === 'true')
    graph2.stop();
}

let stream;
let recorder;
let lock;


rmic();
inputCtl.init();
outputCtl.init();
graph2.init();



/*

var txt = document.getElementById('log');
const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({ log, logger: ({ message }) => { txt.value += "\n" + message; } });
const transcode = async ({ target: { files } }) => {
  const message = document.getElementById('message');
  const { name } = files[0];
  message.innerHTML = 'Loading ffmpeg-core.js';
  await ffmpeg.load();
  await ffmpeg.write(name, files[0]);
  message.innerHTML = 'Start transcoding';
  await ffmpeg.transcode(name, 'output.mp4');
  message.innerHTML = 'Transcoding completed';
  const data = ffmpeg.read('output.mp4');
  ffmpeg.remove('output.mp4');

  const video = document.getElementById('output-video');
  video.src = URL.createObjectURL(new Blob([data.buffer], {
    type: 'video/mp4'
  }));
}
const elm = document.getElementById('uploader');
elm.addEventListener('change', transcode);

*/