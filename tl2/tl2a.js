if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/tl2/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}


const videoFeed = document.getElementById('videoFeed');
const captureCanvas = document.getElementById('captureCanvas');
const timelapseVideo = document.getElementById('timelapseVideo');
const videoOverlay = document.getElementById('videoOverlay');

const startStopBtn = document.getElementById('startStop');
startStopBtn.onchange = startStop;

const statusDisplay = document.getElementById('status');
const ctx = captureCanvas.getContext('2d');


const vrs = new URL(document.currentScript.src).searchParams.get("v") || 'dev';

let isCapturing = false;
let captureTimer;
const capturedImages = [];
let mediaRecorder;
const recordedChunks = [];


const camera = {
  getSupportedMimeTypes: function() {
    const possibleTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=av01,opus',
      'video/x-matroska;codecs=hvc1.1.6.L186.B0,opus',
      'video/mp4;codecs=vp9,mp4a.40.2',
      'video/mp4;codecs=vp9,opus',
      'video/mp4;codecs=avc1.64003E,mp4a.40.2',
      'video/mp4;codecs=avc1.64003E,opus',
      'video/mp4;codecs=avc3.64003E,mp4a.40.2',
      'video/mp4;codecs=avc3.64003E,opus',
      'video/mp4;codecs=hvc1.1.6.L186.B0,mp4a.40.2',
      'video/mp4;codecs=hvc1.1.6.L186.B0,opus',
      'video/mp4;codecs=hev1.1.6.L186.B0,mp4a.40.2',
      'video/mp4;codecs=hev1.1.6.L186.B0,opus',
      'video/mp4;codecs=av01.0.19M.08,mp4a.40.2',
      'video/mp4;codecs=av01.0.19M.08,opus',
      'video/mp4',
    ];
    return possibleTypes.filter(mimeType => {
      return MediaRecorder.isTypeSupported(mimeType);
    });
  }
}


const camSettings = {
  constraints: {
    video: {
      width: { ideal: 720 },
      height: { ideal: 720 },
      facingMode: "environment",
      frameRate: { ideal: 30.0, max: 60.0 }
    },
    audio: false
  },
  caps: {},
  fps: 30,
  jpegQual: 0.9,
  videoMime: "video/webm",
  iso: { cam: true, abr: 'iso', defVal: 'auto', mi: 'camera'},
  timelapse: { value: 2, cam: false, abr: 'speed', defVal: 2, mi: 'avg_pace'},
  duration: { value: 60, cam: false, abr: 'timer', defVal: 60, mi: 'alarm_on'},
  exposureTime: { cam: true, abr: 'exp', defVal: 'auto', mode: 'exposureMode', auto: 'continuous', manual: 'manual', mi: 'exposure'},
  colorTemperature: { cam: true, abr: 'TºK', defVal: 'auto', mode: 'whiteBalanceMode', auto: 'continuous', manual: 'manual', mi: 'device_thermostat'},
  focusDistance:    { cam: true, abr: 'foc', defVal: 'auto', mode: 'focusMode', auto: 'continuous', manual: 'manual', mi: 'frame_person'},
  contrast: { cam: true, abr: 'cnt', defVal: 'auto', mi: 'contrast'},
  saturation: { cam: true, abr: 'sat', defVal: 'auto', mi: 'palette'},
  brightness: { cam: true, abr: 'brt', defVal: 'auto', mi: 'wb_sunny'},
  sharpness: { cam: true, abr: 'shp', defVal: 'auto', mi: 'triangle_circle'},
  track: null,
  drawInterval: function(){ return 1000 / this.fps; },
  init: function(stream){
    this.track = stream.getVideoTracks()[0];
    this.caps = this.track.getCapabilities();
    this.mimeTypes = camera.getSupportedMimeTypes();
    console.dir(this.mimeTypes);
    ui.init()
  },
  refresh: function(){
    if (!this.track) return;
    setupCamera();
  }
}

const ui = {
  
  dialogEl: document.getElementById('dialog'),
  elapsedEl: document.getElementById('elapsedTime'),
  recordedEl: document.getElementById('recordedTime'),
  divCaps: document.getElementById('div-setup'),
  timerEl: document.getElementById('div-timer'),
  speedEl: document.getElementById('tl-speed'),

  init: function(){
    console.dir(camSettings);
    this.speedEl.addEventListener('click', ui.setTimelapseSpeed);

    this.divCaps.replaceChildren();
    //this.divCaps.appendChild(this.getDiv('timelapse'));
    this.divCaps.appendChild(this.getDiv('duration'));
    Object.keys(camSettings.caps).forEach(capName => {
      if (camSettings[capName]){
        ui.divCaps.appendChild(ui.getDiv(capName));
      }
    });
  },
  setTimelapseSpeed: function(e){
    e.stopPropagation();
    let s = parseFloat(prompt('Set timelapse speed x', 60));
    if (isNaN(s) || s <= 0) s = 60;
    ui.speedEl.innerText = `${s}x`;
    camSettings.timelapse.value = s/camSettings.fps;
  },
  getDiv: function(capName, callback){
    const cap = camSettings[capName];
    if (!cap) return document.createElement('div');
    const div = document.createElement('div');
    div.classList.add('flex-1');
    //div.innerHTML = `
    //  ${cap.svg ? cap.svg + "\n\t": ''}<div class="ico-label" id="${capName}-label">${cap.abr}</div>
    //`;
    div.innerHTML = `
        <div class="ico">${cap.mi || 'help'}</div>
        <div class="ico-label" id="${capName}-label">${cap.abr}</div>
    `
    div.addEventListener('click', () => {
      const p = ui.getPrompt(capName);
      const v = prompt(p.text, p.defaultValue);
      ui.applyCap(capName, v, div);
    });
    return div;
  },
  
  getPrompt: function(capName){
    let p = `Set ${capName} value:\n`;
    let defaultValue;
    if (camSettings.caps[capName]){
      const cap = camSettings.caps[capName];
      const currentValue = camSettings.track.getSettings()[capName] || 0;
      p += cap.min >= 0 ? `Min: ${cap.min}\n` : '';
      p += cap.max >= 0 ? `Max: ${cap.max}\n` : '';
      p += cap.step >= 0 ? `Step: ${cap.step}\n` : '';
      p += cap instanceof Array ? `Options: ${cap.join(', ')}\n` : '';
      p += `Current: ${currentValue}`;
      defaultValue = currentValue;
    } else {
      currentValue = camSettings[capName] || 1;
      defaultValue = currentValue;
    }
    return { text: p, defaultValue: defaultValue };
  },
  
  parseUserValue: function(userValue){
    if (userValue === 'max' && camSettings.caps[capName].max)
      userValue = camSettings.caps[capName].max;
    else if (userValue === 'min' && camSettings.caps[capName].min)
      userValue = camSettings.caps[capName].min;
    if (!isNaN(parseFloat(userValue))){
      return parseFloat(userValue);
    }
    return userValue;
  },

  applyCap: function(capName, userValue, uiEl){
    if (camSettings[capName]){
      const key = camSettings[capName];
      if (userValue === 'auto' && key.auto){
        camSettings.constraints.video[key.mode] = key.auto;
        delete camSettings.constraints.video[capName];
      } else if (key.manual){
        camSettings.constraints.video[key.mode] = key.manual;
        camSettings.constraints.video[capName] = ui.parseUserValue(userValue);
      } else if (camSettings[capName].cam){
        camSettings.constraints.video[capName] = ui.parseUserValue(userValue);
      } else {
        camSettings[capName].value = userValue;
      }
    }
    camSettings.refresh();
    uiEl.querySelector('.ico-label').textContent = `${userValue}`;
  },

  promptDismiss: function(){
    document.getElementById('customPrompt').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
  },
  promptSelect: function(arr, callback){
    document.getElementById('customPrompt').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('prompt-ok').onclick = () => {
      ui.promptDismiss();
      callback(sel.value);
    }
    document.getElementById('prompt-cancel').onclick = this.promptDismiss
    const sel = document.getElementById('selectOption');
    sel.replaceChildren();
    arr.forEach(k => {
      const e = document.createElement('option');
      e.value = k;
      e.innerText = k;
      sel.appendChild(e)
    });
    sel.addEventListener('change', () => {
      
      
    });
  }
}

// --- 1. Initialize Camera Stream ---
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(camSettings.constraints);
    videoFeed.srcObject = stream;
    camSettings.init(stream);
    const v = camSettings.videoMime.split(/[/;=,]/);
    statusDisplay.textContent = `Status: Camera ready. ${v[1]} ${v[3] || 'default'}`;
  } catch (err) {
    statusDisplay.textContent = 'Status: Error accessing camera. Please ensure permissions are granted.';
    console.error("Error accessing camera: ", err);
  }
}

function showInfo(){
  alert(`${JSON.stringify(camSettings.constraints.video, null, 2)}`);
}

function showCaps(){
  alert(`${JSON.stringify(camSettings.caps)}`);
}

function setMime(){
  ui.promptSelect(camSettings.mimeTypes, (m) => {
    camSettings.videoMime = m;
    const v = camSettings.videoMime.split(/[/;=,]/);
    statusDisplay.textContent = `Status: Camera ready. ${v[1]} ${v[3] || 'default'}`;
  });
}


// --- 2. Camera Capture Functions ---
function captureFrame() {
  // 1. Ensure canvas matches video size for clean capture
  captureCanvas.width = videoFeed.videoWidth;
  captureCanvas.height = videoFeed.videoHeight;

  // 2. Draw the current video frame onto the canvas
  ctx.drawImage(videoFeed, 0, 0, captureCanvas.width, captureCanvas.height);

  // 3. Get the image data URL and store it
  const dataURL = captureCanvas.toDataURL('image/jpeg', camSettings.jpegQual); // 0.8 is quality
  capturedImages.push(dataURL)
  const secs = capturedImages.length / camSettings.fps;
  stats.frames = capturedImages.length;
  videoOverlay.textContent = `${capturedImages.length}`;
  if (secs > camSettings.duration.value){
    stopCaptureAndGenerate();
  }
}

const screen = {
  lock: null,
  setLock: async function (state=true) {
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
}

  
function startCapture() {
  const intervalSeconds = parseFloat(camSettings.timelapse.value  );
  if (isNaN(intervalSeconds) || intervalSeconds < 0.1) {
    alert("Please set a valid capture interval (min 100 millisecond).");
    return;
  }
  screen.setLock(true);
  camSettings.refresh()
  console.dir(camSettings);
  isCapturing = true;
  //intervalInput.disabled = true;
  timelapseVideo.style.display = 'none';
  capturedImages.length = 0; // Clear previous images

  // Capture the first frame immediately
  captureFrame(); 

  // Set the timer to capture frames repeatedly
  captureTimer = setInterval(captureFrame, intervalSeconds * 1000);
  stats.start();
  stats.statTimer = setInterval(stats.postStats.bind(stats), 1000);
}

const stats = {
  frames: 0,
  startTime: 0,
  elapsedTime: 0,
  recordedTime: 0,
  statTimer: null,
  start: function(){
    this.frames = 0;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.recordedTime = 0;
    this.postStats();
    ui.timerEl.style.display = 'block';
  },
  postStats: function(){
    this.elapsedTime = (Date.now() - this.startTime);
    this.recordedTime = this.frames / camSettings.fps;
    ui.elapsedEl.textContent = new Date(this.elapsedTime).toISOString().substr(11, 8);
    ui.recordedEl.textContent = `${new Date(this.recordedTime * 1000).toISOString().substr(14, 8)}`;
  },
  stop: function(){
    ui.timerEl.style.display = 'none';
  }
}


function stopCaptureAndGenerate() {
  screen.setLock(false);
  isCapturing = false;
  clearInterval(captureTimer);
  clearInterval(stats.statTimer);
  //intervalInput.disabled = false;

  if (capturedImages.length < 2) {
    statusDisplay.textContent = 'Status: Need at least 2 frames to create a video.';
    return;
  }
  
  // Start the video generation process
  generateTimelapseVideo();
}

// --- 3. MediaRecorder (Video Generation) ---
async function generateTimelapseVideo() {
  statusDisplay.textContent = 'Status: Generating video... Do not close window.';
  recordedChunks.length = 0;
  // 1. Create a stream from the canvas
  const stream = captureCanvas.captureStream(camSettings.fps); 
  
  // 2. Setup the MediaRecorder
  mediaRecorder = new MediaRecorder(stream, { mimeType: camSettings.videoMime });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // 4. Combine chunks into a video blob and display
    const blob = new Blob(recordedChunks, { type: camSettings.videoMime });
    timelapseVideo.src = URL.createObjectURL(blob);
    timelapseVideo.style.display = 'block';
    statusDisplay.textContent = `Status: Video generated! Total frames: ${capturedImages.length}.`;
    
    // Clean up the in-memory images to free resources
    capturedImages.length = 0; 
    downloadVideo(blob);
  };

  // 3. Start recording and animation loop
  mediaRecorder.start();
  drawNextFrame(0);
}

function drawNextFrame(frameIndex) {
  if (frameIndex >= capturedImages.length) {
    // Stop recording when all stored frames have been drawn
    mediaRecorder.stop();
    return;
  }

  // Load and draw the stored Data URL image onto the canvas
  const img = new Image();
  img.onload = () => {
    // Redraw canvas with the new frame
    ctx.drawImage(img, 0, 0, captureCanvas.width, captureCanvas.height); 
    
    // Schedule the next frame drawing based on the video's FRAME_RATE
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        drawNextFrame(frameIndex + 1);
      }
    }, camSettings.drawInterval());
  };
  img.src = capturedImages[frameIndex];
}

// --- 4. Event Listeners ---
function startStop() {
  if (!isCapturing) {
      startCapture();
  } else {
      stopCaptureAndGenerate();
  }
}

function downloadVideo(blob) {
  videoOverlay.innerHTML = '';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ext = camSettings.videoMime.split(/[/;]/)[1];
  a.style.display = 'none';
  a.href = url;
  a.download = `TL-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Start camera setup when the video feed metadata is loaded
videoFeed.addEventListener('loadedmetadata', () => {
  // Set the canvas size based on the live feed resolution
  captureCanvas.width = videoFeed.videoWidth;
  captureCanvas.height = videoFeed.videoHeight;
});

ui.init();
// Initial camera setup
setupCamera();

alert(`Timelapse Camera version: ${vrs}`);