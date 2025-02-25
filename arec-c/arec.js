Number.prototype.strSI = function(unit, fixed=2, mul=1024){
  const sfx = ['', 'K', 'M', 'G', 'T'];
  let i = 0;
  let v = this;
  while (v >= mul && i++ < 4)
    v /= 1024;
  return `${v.toFixed(fixed)} ${sfx[i]}${unit}`;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/arec/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const audioContext = new(window.AudioContext || window.webkitAudioContext);
const touchEvent = 'click'; //'ontouchstart' in window ? 'touchstart' : 'click';
const startStopButton = document.getElementById('startStop');

startStopButton.onchange = startStop;

const logger = {
  id: document.getElementById('log-stat'),
  did: document.getElementById('code'),
  dataSize: 0,
  log: function(msg){
    this.id.innerText = msg;
  },
  d: function(msg){
    if (msg === null)
      this.did.innerText = "";
    else  
      this.did.innerText += msg;
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
    this.audioContext = new (window.AudioContext || window.webkitAudioContext);
    let canvas = document.getElementById('canvas');
    this.canvasSize = { width: canvas.width, height: canvas.height}
    this.ctx = canvas.getContext("2d");
    const body = window.getComputedStyle(document.body, null);
    this.ctx.fillStyle = body.backgroundColor;
    this.ctx.strokeStyle = body.accentColor;
    this.ctx.lineCap = "round";
  },
  start: function(context, stream){
    this.container.style.display = 'flex';
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
  stop: function(context){
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

const outputCtl = {
  timeout: 3 * 60000,
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
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
    voiceIsolation: false,
    suppressLocalAudioPlayback: false,
    sampleRate: 48000,
    channelCount: 2,
    sampleSize: 16,
  }
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
    let blob = new Blob(this.chunks, { type: "audio/ogg" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.getTimestampFilename() + ".ogg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.chunks = [];
    logger.log("idle");
  }
}

function startStop(){
  if (startStopButton.checked)
    startRecording();
  else
    stopRecording();
}

async function startRecording(){
  logger.d(null);
  stream = await navigator.mediaDevices.getUserMedia(session);
  lock = await navigator.wakeLock.request('screen');
  recorder = new MediaRecorder(stream);
  recorder.start(dataManager.chunkTimeout);
  graph2.start(audioContext, stream);  
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
  graph2.stop(audioContext);
}

let stream;
let recorder;
let lock;

graph2.init();