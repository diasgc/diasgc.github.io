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
  timeout: 3600000, // 1 hour
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
  logId: document.getElementById('code'),
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
    this.socket = new WebSocket("wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000");
    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      recorder.screenLock(true);
      navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);
        processor.onaudioprocess = (event) => {
          const audioData = event.inputBuffer.getChannelData(0);
          recorder.socket.send(audioData);
        };
        timer.start();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
    };
    this.socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.log('WebSocket connection died');
      }
    };
    this.socket.onerror = (error) => {
      console.error(`WebSocket error: ${error.message}`);
    };
    this.socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.text) {
        this.logId.innerText += data.text;
      }
    };
  },
  stop: function(){
    recorder.screenLock(false);
    recorder.socket.close();
    timer.stop();
  }
}

function startStop(){
  if (startStopButton.checked)
    recorder.start();
  else
    recorder.stop();
}

let stream;

rmic();
graph.init();