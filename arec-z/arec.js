Number.prototype.strSI = function(unit, fixed=2, mul=1024){
  const sfx = ['', 'K', 'M', 'G', 'T'];
  let i = 0;
  let v = this;
  while (v >= mul && i++ < 4)
    v /= 1024;
  return `${v.toFixed(fixed)} ${sfx[i]}${unit}`;
}

// set version
const vrs = new URL(document.currentScript.src).searchParams.get("v");
document.getElementById('vinfo').innerText = `version ${vrs}`;

const touchEvent = 'click'; //'ontouchstart' in window ? 'touchstart' : 'click';
const divMain = document.getElementById('div-main');
const startStopButton = document.getElementById('startStop');
const micButton = document.getElementById('startStop');
const urlParams = new URLSearchParams(window.location.search);

startStopButton.onchange = startStop;
document.getElementById('rec-mc0').onchange = rmic;
document.getElementById('rec-mc1').onchange = rmic;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/arec-z/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const logger = {
  id: document.getElementById('log-stat'),
  did: document.getElementById('code'),
  dataSize: 0,
  log: function(msg){
    this.id.innerText = msg;
  },
  d: function(msg){
    this.did.innerText = msg === null ? "" : `${this.did.innerText}\n${msg}`;
  },
  addSize: function(size){
    this.dataSize += size;
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

const audioInput_new = {
  panelId: document.getElementById('fs-input'),
  summaryId: document.getElementById('fs-input-summary'),
  isCollapsed: true,
  constrains: {
    deviceId:         { name: "source", lab: "src ", sfx: "", entries: {} },
    channelCount:     { name: "channels", lab: "", sfx: "", entries: { "mono": "1", "stereo*": "2" } },
    sampleSize:       { name: "bits", lab: "", sfx: "-bits", entries: { "8": "8", "16*": "16"} },
    sampleRate:       { name: "samplerate", lab: "", sfx: "Hz", entries: {"8k": "8000", "11k": "11025", "44k": "44100", "48k*": "48000", "96k": "96000" } },
    autoGainControl:  { name: "agc", lab: "agc ", sfx: "", entries: { "off*": "false", "on": "true" } },
    noiseSuppression: { name: "noise", lab: "nr ", sfx: "", entries: { "off*": "false", "on": "true" } },
    echoCancellation: { name: "echo", lab: "echo ", sfx: "", entries: { "off*": "false", "on": "true" } },
    voiceIsolation:   { name: "voice", lab: "voice ", sfx: "", entries: { "off*": "false", "on": "true" } },
    suppressLocalAudioPlayback: { name: "local ", lab: "local ", sfx: "", entries: { "off*": "false", "on": "true" } },  
  },
  effects: {
    audioGain: { name: "gain", lab: "", sfx: "", entries: { "off*": "1", "1.5x": "1.5", "2x": "2", "2.5x": "2.5", "5x": "5"}},
  },
  init: function(){
    let fs = document.getElementById('fsi');
    fs.addEventListener(touchEvent, this.toggleView);
    this.fsi.replaceChildren();
    this.enumerateDevices();
    this.supportedConstraints = this.loadSupportedConstraints();
    Object.keys(audioInput.constrains).forEach(key => {
      const v = audioInput.constrains[key];
      if (v && JSON.stringify(v.entries).length > 8){
        const e = fsBuilder.build("radio", v, audioInput.options, key);
        audioInput.fsi.appendChild(e);
      }
    })
    this.collapse();
  },
  loadSupportedConstraints: function(){
    const c = navigator.mediaDevices.getSupportedConstraints();
    Object.keys(c).forEach((key) => {
      if (audioInput.constrains[key] === 'undefined') delete c[key];
    });
    return c;
  },
  enumerateDevices: function(){
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
      devices.forEach((device) => {
        if (device.kind === 'audioinput'){
          let lab = device.label.substring(0,7) + (device.deviceId === 'default' ? "*" : "");
          this.deviceId.entries[lab] = device.deviceId;
        }
      });
    });
  }
}


const inputCtl = {
  fsi: document.getElementById('fs-input'),
  isCollapsed: true,
  summary: document.getElementById('fs-input-summary'),
  audioConstraints: [ 'deviceId', 'channelCount', 'sampleSize', 'sampleRate','autoGainControl', 'echoCancellation', 'latency', 'noiseSuppression', 'pan', 'suppressLocalAudioPlayback','voiceIsolation','audioGain' ],
  supportedConstraints: {},

  deviceId:         { name: "source", lab: "src ", sfx: "", entries: {} },
  channelCount:     { name: "channels", lab: "", sfx: "", entries: { "mono": "1", "stereo*": "2" } },
  sampleSize:       { name: "bits", lab: "", sfx: "-bits", entries: { "8": "8", "16*": "16"} },
  sampleRate:       { name: "samplerate", lab: "", sfx: "Hz", entries: {"8k": "8000", "11k": "11025", "44k": "44100", "48k*": "48000", "96k": "96000" } },
  autoGainControl:  { name: "agc", lab: "agc ", sfx: "", entries: { "off*": "false", "on": "true" } },
  noiseSuppression: { name: "noise", lab: "nr ", sfx: "", entries: { "off*": "false", "on": "true" } },
  echoCancellation: { name: "echo", lab: "echo ", sfx: "", entries: { "off*": "false", "on": "true" } },
  voiceIsolation:   { name: "voice", lab: "voice ", sfx: "", entries: { "off*": "false", "on": "true" } },
  suppressLocalAudioPlayback: { name: "local ", lab: "local ", sfx: "", entries: { "off*": "false", "on": "true" } },
  audioGain:        { name: "gain", lab: "gain", sfx: "", entries: { "off*": "1", "1.5x": "1.5", "2x": "2", "2.5x": "2.5", "5x": "5"}},
  
  options: {
    echoCancellation: "false",
    noiseSuppression: "false",
    autoGainControl: "false",
    voiceIsolation: "false",
    suppressLocalAudioPlayback: "false",
    sampleRate: "48000",
    channelCount: "2",
    sampleSize: "16",
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
    return {
      audio: {
        echoCancellation: this.options.echoCancellation === "true" ? true : false,
        noiseSuppression: this.options.noiseSuppression === "true" ? true : false,
        autoGainControl: this.options.autoGainControl === "true" ? true : false,
        voiceIsolation: this.options.voiceIsolation === "true" ? true : false,
        //suppressLocalAudioPlayback: this.options.suppressLocalAudioPlayback === "true" ? true : false,
        sampleRate: parseInt(this.options.sampleRate),
        channelCount: parseInt(this.options.channelCount),
        sampleSize: parseInt(this.options.sampleSize)
      }
    }
  }
}

const outputCtl = {
  fsi: document.getElementById('fs-output'),
  isCollapsed: true,
  summary: document.getElementById('fs-output-summary'),
  builtInContainers: [ "webm", "mp4", "ogg" ],
  builtInCodecs: [ "opus", "pcm" ],
  graph: { name: "graph", entries: { "off": "false", "on*": "true"} },
  debug: { name: "debug", entries: { "off*": "false", "on": "true"} },
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
    mimeType: "audio/webm;codecs=opus",
    container: 'webm',
    codec: 'opus',
    timer: "300000",
    graph: "true",
    debug: "false"
  },

  options2: {
    bitsPerSecond : "128000",
    mimeType: "audio/ogg",
    container: 'ogg',
    timer: "300000",
    graph: "true",
    debug: "false"
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
    let fs = document.getElementById('fso');
    fs.addEventListener(touchEvent, this.toggleView);
    this.fsi.appendChild(fsBuilder.build("radio", this.audioBitsPerSecond, this.options, "audioBitsPerSecond"));
    this.fsi.appendChild(fsBuilder.build("radio", this.audioBitrateMode, this.options, "audioBitrateMode"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cnt, this.options, "container"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cod, this.options, "codec"));
    this.fsi.appendChild(fsBuilder.build("radio", this.timer, this.options, "timer"));
    this.fsi.appendChild(fsBuilder.build("radio", this.graph, this.options, "graph"));
    this.fsi.appendChild(fsBuilder.build("radio", this.debug, this.options, "debug"));
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
      opts.mimeType = "audio/webm;codecs=pcm";
      this.transcode = true;
    }
    opts.audioBitsPerSecond = parseInt(opts.audioBitsPerSecond);
    //delete opts.audioBitsPerSecond;
    delete opts.container;
    delete opts.codec;
    delete opts.timer;
    delete opts.graph;
    delete opts.debug;
    return opts;
  }
}

const micCtl = {
  micOn: document.getElementById('rec-mc1')
}

const graph = {
  container: document.getElementById('graph'),
  fftSize: 256,  
  init: function(){
    let canvas = document.getElementById('canvas');
    this.size = { width: canvas.width, height: canvas.height}
    this.ctx = canvas.getContext("2d");
    const body = window.getComputedStyle(document.body, null);
    this.ctx.fillStyle = body.backgroundColor;
    this.ctx.strokeStyle = body.accentColor;
    this.ctx.lineCap = "round";
  },
  stop: function(){
    this.isEnabled = false;
    this.container.style.display = 'none';
  },
  start: function(){
    // show graph
    this.container.style.display = 'flex';
    
    const audioContext = recorder.audioContext;
    const splitter = recorder.splitter;
    this.dim = recorder.constraints.audio.channelCount;
    this.analyser = [];
    this.buffLen = [];
    this.data = [];
    
    for (var a = 0; a < this.dim; a++){
      let analyser = audioContext.createAnalyser();
      splitter.connect(analyser, a);
      analyser.fftSize = this.fftSize / 2;
      let buffLen = analyser.frequencyBinCount;
      graph.buffLen = buffLen;
      graph.data[a] = new Uint8Array(buffLen);
      graph.analyser[a] = analyser;
    }
    
    this.barWidth = Math.round(this.size.width / this.buffLen / 2);
    this.ctx.lineWidth = 1.5; //this.barWidth;
    this.isEnabled = true;
    
    console.dir(this);
    this.draw();
  },
  draw: function(){
    graph.ctx.fillRect(0, 0, graph.size.width, graph.size.height);
    
    const ay = graph.size.height - graph.barWidth / 2;
    var kx, ky = ay / 2, dyL, dyR, cx = graph.size.width / 2;

    for (var c = 0 ; c < graph.dim; c++){
      graph.analyser[c].getByteFrequencyData(graph.data[c]);
      let fc = c * 2 - 1;
      for (var i = 0; i < graph.buffLen; i++) {
        kx = fc * graph.barWidth * (i + 0.25);
        dy = graph.data[c][i] * 0.25;
        graph.ctx.beginPath();
        graph.ctx.moveTo(cx + kx, ky + dy);
        graph.ctx.lineTo(cx + kx, ky - dy);
        graph.ctx.stroke();
      }
    }
    requestAnimationFrame(graph.draw);
  }
}

const recorder = {
  mediaRecorder: '',
  chunks: [],
  chunkTimeout: 5000,
  lock: null,
  type: 'audio/ogg',
  ext: 'ogg',
  constraints: {
    audio: {
      channelCount: 2,
      sampleRate: 48000,
      sampleSize: 16,
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false
    },
    video: false
  },
  outSpecs: {
    audioBitsPerSecond : "128000",
    //audioBitrateMode : "variable",
    mimeType: "audio/ogg;codecs=opus",
  },
  add: function(data){
    recorder.chunks.push(data);
    logger.addSize(data.size);
    logger.log(`size: ${logger.dataSize.strSI('B')}`);
  },
  timeStamp: function() {
    return "rec-" + new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g,'')
      .replace(/T/g,'-');
  },
  screenLock: async function (state=true) {
    if ("wakeLock" in navigator && state){
      try {
        this.lock = await navigator.wakeLock.request('screen');
        console.log('Wake lock is active');
        this.lock.addEventListener('release', () => {
          console.log('Wake lock was released');
        });
      } catch (err) {
        console.error(`Failed to acquire wake lock: ${err.message}`);
      }
    } else if (this.lock){
      this.lock.release();
      this.lock = null;
      console.log('Wake lock released manually');
    }
  },
  save: function() {
    let blob = new Blob(this.chunks, { type: recorder.type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.timeStamp()}.${recorder.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.chunks = [];
    logger.log("idle");
  },
  // https://stackoverflow.com/questions/73665100/using-web-api-audioencoder-to-output-opus-frames
  start: function(){
    // merge constraints
    const inOpts = inputCtl.getOptions();
    recorder.constraints = {...recorder.constraints, ...inOpts};
    console.dir(recorder.constraints);
    navigator.mediaDevices
      .getUserMedia(recorder.constraints)
      .then(stream => {
        const tracks = stream.getAudioTracks();
        const caps = tracks[0].getCapabilities();
        const channelCount = recorder.constraints.audio.channelCount;
        console.dir(caps);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        const destination = audioContext.createMediaStreamDestination();
        if (caps.channelCount.max !== caps.channelCount.min)
          destination.channelCount = channelCount;
        
        const merger = audioContext.createChannelMerger(channelCount);

        const splitter = audioContext.createChannelSplitter(channelCount);
        source.connect(splitter);

        const gain = parseFloat(inputCtl.options.audioGain)

        for (var c = 0 ; c < channelCount; c++){
          const g = audioContext.createGain();
          splitter.connect(g,c);
          g.gain = gain;
          g.connect(merger,0, c);
        }
        
        merger.connect(destination);

        const outOpts = outputCtl.getOptions();
        console.dir(outOpts);
        recorder.mediaRecorder = new MediaRecorder(destination.stream, graph.outSpecs);
        recorder.mediaRecorder.ondataavailable = event => recorder.add(event.data);
        recorder.mediaRecorder.onstop = () => recorder.save();
        
        // Start recording
        recorder.screenLock(true);
        recorder.audioContext = audioContext;
        recorder.splitter = splitter;
        recorder.source = source;
        recorder.mediaRecorder.start(recorder.chunkTimeout);
        timer.start();
        graph.start();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  },
  stop: function(){
    recorder.screenLock(false);
    recorder.mediaRecorder.stop();
    timer.stop();
    graph.stop();
    if (recorder.audioContext)
      recorder.audioContext.close();
    if (recorder.source)
      recorder.source.disconnect();
  }
}

async function startRecording(){
  inputCtl.collapse();
  inputCtl.setDisabled(true);
  outputCtl.collapse();
  outputCtl.setDisabled(true);
  recorder.start();
}

async function stopRecording(){
  // Stop the recording.
  recorder.stop();
  inputCtl.setDisabled(false);
  outputCtl.setDisabled(false);
}

function startStop(){
  if (startStopButton.checked)
    startRecording();
  else
    stopRecording();
}

let stream;

rmic();
inputCtl.init();
outputCtl.init();
graph.init();