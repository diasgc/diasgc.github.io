
const divMain = document.getElementById('div-main');
const startStopButton = document.getElementById('startStop');

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
    //logger.log("size: " + logger.dataSize + " bytes");
  },
  stop: function(){
    this.timerInterval = clearInterval(timer.timerInterval);
    this.id.innerText = "00:00:00";
  }
}

const devices = {
  inputDevices: '',
  log: document.getElementById('logs'),
  init: function(){
    this.log.innerText = '';
    navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        this.log.innerText += `${device.kind}: ${device.label} id = ${device.deviceId}\n`;
        if (device.kind === 'audioinput')
          this.inputDevices[device.deviceId] = device.label;
      });
    })
    .catch((err) => {
      console.error(`${err.name}: ${err.message}`);
    });
  }
}

function rmic(){
  if (micCtl.micOn.checked){
    divMain.disabled = false;
    divMain.style.opacity = 1;
    navigator.mediaDevices.getUserMedia({ audio: true });
    devices.init();
    startStopButton.disabled = false;
  } else {
    divMain.disabled = true;
    divMain.style.opacity = 0.1;
    startStopButton.disabled = true;
    if (stream)
      stream.getTracks().forEach(track => track.stop());

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
      if(key.includes('*')){
        input.checked = true;
        key = key.replace('*', '');
      }
      let id = fs.name.substring(0,2) + "-" + key;
      input.type = type;
      input.id = id;
      input.name = fs.name;
      input.value = fs.entries[key];
      input.onchange = function(){
        options[opt] = input.value;
      };
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
  ich: { name: "channels", entries: { "mono": 1, "stereo*": 2 } },
  ibt: { name: "bitdepth", entries: { "8": 8, "16*": 16 } },
  isr: { name: "samplerate",
    entries: {
      "8k": 8000,
      "11k": 11025,
      "22k": 22050,
      "44k": 44100,
      "48k*": 48000,
      "96k": 96000
    }
  },
  iag: { name: "gain", entries: { "off": false, "on*": true } },
  inr: { name: "noise", entries: { "off*": false, "on": true } },
  iec: { name: "echo", entries: { "off*": false, "on": true } },
  options: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 48000,
    channelCount: 2,
    volume: 1.0,
    sampleSize: 16,
    latency: 0
  },
  init: function(){
    this.fsi.replaceChildren();
    this.fsi.appendChild(fsBuilder.build("radio", this.ich, this.options, "channelCount"));
    this.fsi.appendChild(fsBuilder.build("radio", this.ibt, this.options, "sampleSize"));
    this.fsi.appendChild(fsBuilder.build("radio", this.isr, this.options, "sampleRate"));
    this.fsi.appendChild(fsBuilder.build("radio", this.iag, this.options, "autoGainControl"));
    this.fsi.appendChild(fsBuilder.build("radio", this.inr, this.options, "noiseSuppression"));
    this.fsi.appendChild(fsBuilder.build("radio", this.iec, this.options, "echoCancellation"));
  },
  getOptions: function(){
    return this.options;
  }
}

const outputCtl = {
  fsi: document.getElementById('fs-output'),
  brt: { name: "bitrate", entries: {
    "32k": 32000, "56k": 56000, "128k": 128000,
    "192k": 192000, "256k*": 256000, "320k": 320000, "512k": 512000 } },
  vbr: { name: "mode", entries: { "cbr": "constant", "vbr*": "variable" } },
  cnt: { name: "extension", entries: { "webm": "webm", "mp4*": "mp4" } },
  cod: { name: "codec", entries: { "pcm": "pcm", "opus*": "opus" } },
  mimeType: "audio/webm",
  options: {
    audioBitsPerSecond : 256000,
    audioBitrateMode : "variable",
    mimeType: "audio/webm;codecs=opus",
    container: 'mp4',
    codec: 'opus',
  },
  init: function(){
    this.fsi.replaceChildren();
    this.fsi.appendChild(fsBuilder.build("radio", this.brt, this.options, "audioBitsPerSecond"));
    this.fsi.appendChild(fsBuilder.build("radio", this.vbr, this.options, "audioBitrateMode"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cnt, this.options, "container"));
    this.fsi.appendChild(fsBuilder.build("radio", this.cod, this.options, "codec"));
  },
  getOptions: function(){
    let opts = JSON.parse(JSON.stringify(this.options));
    this.mimeType = "audio/" + opts.container;
    opts.mimeType = this.mimeType + ";codecs=" + opts.codec;
    delete opts.container;
    delete opts.codec;
    return opts;
  }
}

function saveFile(data, filename, type) {
  const blob = new Blob([data], { type: type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getTimestampFilename() {
  return "rec-" + new Date(Date.now())
    .toISOString()
    .slice(0, 19)
    .replace(/-|:/g,'')
    .replace(/T/g,'-');
}

const micCtl = {
  micOn: document.getElementById('rec-mc1')
}

const dataManager = {
  chunks: [],
  add: function(data){
    this.chunks.push(data);
  },
  getTimestampFilename() {
    return "rec-" + new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g,'')
      .replace(/T/g,'-');
  },
  save: function() {
    const blob = new Blob(this.chunks, { type: outputCtl.mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.getTimestampFilename() + "." + outputCtl.options.container;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function startStop(){
  if (startStopButton.checked)
    startRecording();
  else
    stopRecording();
}

startRecording = async() => {
  stream = await navigator.mediaDevices.getUserMedia({ audio: inputCtl.getOptions() });
  lock = await navigator.wakeLock.request('screen');
  recorder = new MediaRecorder(stream, outputCtl.getOptions());
  
  recorder.start();
  recorder.addEventListener("dataavailable", async (event) => {
    dataManager.add(event.data);
    if (recorder.state === "inactive")
      dataManager.save();
  });

  timer.start();
  
}

stopRecording = async() => {
  // Stop the recording.
  recorder.stop();
  timer.stop();
  if (lock != null){
    await lock.release();
    lock = null;
  }
}

let stream;
let recorder;
let lock;

rmic();
inputCtl.init();
outputCtl.init();




/*

var txt = document.getElementById('log');
const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true, logger: ({ message }) => { txt.value += "\n" + message; } });
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