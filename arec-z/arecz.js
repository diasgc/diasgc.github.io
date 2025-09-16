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
    if (msg === null)
      this.did.innerText = "";
    else  
      this.did.innerText += msg;
  },
  addSize: function(size){
    this.dataSize += size;
  }
}

const timer = {
  id: document.getElementById('timer'),
  startTime: 0,
  timerInterval: '',
  timeout: 300000,
  start: function(){
    this.startTime = Date.now();
    this.timerInterval = setInterval(timer.update.bind(timer), 1000);
  },
  update: function(){
    const elapsedTime = Date.now() - this.startTime;
    this.id.innerText = new Date(elapsedTime).toISOString().slice(11, 19);
    if (elapsedTime > this.timeout)
      document.getElementById('startStop').click();
  },
  stop: function(){
    this.timerInterval = clearInterval(timer.timerInterval);
    this.id.innerText = "00:00:00";
  }
}

const graph = {
  container: document.getElementById('graph'),
  canvasSize: '',
  fftSize: 256,
  lines: 20,
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
  connectChannel(audioContext, splitter, channel = 0){
    this.container.style.display = 'flex';
    const analyser = audioContext.createAnalyser();
    splitter.connect(analyser, channel);
    analyser.fftSize = this.fftSize;
    const buffLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(buffLen);
    const barWidth = (500 - 2 * buffLen - 4) / buffLen * 2.5;
    this.ctx.lineWidth = barWidth;
    this.drawChannel(analyser, barWidth, dataArray, buffLen, channel);
  },
  drawChannel: function(analyser, barWidth, dataArray, buffLen, channel){
    const p = channel * 2 - 1; // (0,1) => (-1,1)
    graph.ctx.fillRect(0, 0, graph.canvasSize.width, graph.canvasSize.height);
    analyser.getByteFrequencyData(dataArray);
    const ay = graph.canvasSize.height - barWidth / 2;
    var kx, ky = ay, dy;
    for (var i = 0; i < buffLen; i++) {
      kx = 4 + 2 * i * barWidth + barWidth / 2;
      dy = dataArray[i] * 0.5;
      graph.ctx.beginPath();
      graph.ctx.moveTo(kx, ky);
      graph.ctx.lineTo(kx, ky - dy * p);
      graph.ctx.stroke();
    }
    requestAnimationFrame(graph.drawChannel(analyser,barWidth,dataArray,buffLen,channel));
  },
  start: function(audioContext, stream){
    this.container.style.display = 'flex';
    this.audioContext = audioContext;
    this.source = audioContext.createMediaStreamSource(stream);
    this.analyser = audioContext.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.fftSize = this.fftSize;
    this.buffLen = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.buffLen);
    this.barWidth = (500 - 2 * this.buffLen - 4) / this.buffLen * 2.5;
    this.ctx.lineWidth = graph.barWidth;
    this.isEnabled = true;
    this.draw();
  },
  stop: function(){
    this.isEnabled = false;
    this.container.style.display = 'none';
    this.audioContext.close();
    this.source.disconnect;
  },
  draw: function(){
    graph.ctx.fillRect(0, 0, graph.canvasSize.width, graph.canvasSize.height);
    if (graph.isEnabled){
      graph.analyser.getByteFrequencyData(graph.dataArray);
      const ay = graph.canvasSize.height - graph.barWidth / 2;
      if (graph.centered){
        var kx, ky = ay / 2, dy;
        for (var i = 0; i < graph.buffLen; i++) {
          kx = 4 + 2 * i * graph.barWidth + graph.barWidth / 2;
          dy = graph.dataArray[i] * 0.25;
          graph.ctx.beginPath();
          graph.ctx.moveTo(kx, ky + dy);
          graph.ctx.lineTo(kx, ky - dy);
          graph.ctx.stroke();
        }
      } else {
        var kx, ky = ay, dy;
        for (var i = 0; i < graph.buffLen; i++) {
          kx = 4 + 2 * i * graph.barWidth + graph.barWidth / 2;
          dy = graph.dataArray[i] * 0.5;
          graph.ctx.beginPath();
          graph.ctx.moveTo(kx, ky);
          graph.ctx.lineTo(kx, ky - dy);
          graph.ctx.stroke();
        }
      }
      requestAnimationFrame(graph.draw);
    }
  }
}

const recorder = {
  mediaRecorder: '',
  chunks: [],
  chunkTimeout: 5000,
  type: 'audio/webm',
  ext: 'webm',
  constraints: {
    audio: {
      channelCount: 2,
      sampleRate: 48000,
      sampleSize: 16,
    },
    video: false
  },
  add: function(data){
    recorder.chunks.push(data);
    logger.addSize(data.size);
    logger.log(`size: ${logger.dataSize.strSI('B')}`);
  },
  getFilename: function() {
    return "rec-" + new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g,'')
      .replace(/T/g,'-');
  },
  save: function() {
    let blob = new Blob(this.chunks, { type: this.type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.getFilename()}.${this.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.chunks = [];
    logger.log("idle");
  },
  start: function(){
    navigator.mediaDevices
      .getUserMedia(recorder.constraints)
      .then(stream => {
        const audioContext = new AudioContext();
        
        // stereo hack: split stereo to merge and force stereo
        const splitter = audioContext.createChannelSplitter(2); // Split stereo input
        const merger = audioContext.createChannelMerger(2);     // Merge into stereo
        const destination = audioContext.createMediaStreamDestination();
        
        splitter.connect(merger, 0, 0); // Left
        splitter.connect(merger, 0, 1); // Right
        merger.connect(destination);
        
        recorder.mediaRecorder = new MediaRecorder(destination.stream);
        recorder.mediaRecorder.ondataavailable = event => recorder.add(event.data);
        recorder.mediaRecorder.onstop = () => recorder.save();
        
        // Start recording
        recorder.mediaRecorder.start(recorder.chunkTimeout);
        timer.start();
        //graph.start(audioContext, stream);
        graph.connectChannel(audioContext, splitter, 0);
        graph.connectChannel(audioContext, splitter, 1);
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  },
  stop: function(){
    recorder.mediaRecorder.stop();
    timer.stop();
    graph.stop();
  }
}


function startStop(){
  if (startStopButton.checked)
    recorder.start();
  else {
    recorder.stop();
    if (lock != null){
      lock.release();
      lock = null;
    }
  }
}

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
const urlParams = new URLSearchParams(window.location.search);

startStopButton.onchange = startStop;

let stream;
let lock;

graph.init();