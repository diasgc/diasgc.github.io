const videoFeed = document.getElementById('videoFeed');
const captureCanvas = document.getElementById('captureCanvas');
const timelapseVideo = document.getElementById('timelapseVideo');
const startStopBtn = document.getElementById('startStop');
//const intervalInput = document.getElementById('interval');
const statusDisplay = document.getElementById('status');
const ctx = captureCanvas.getContext('2d');
const duration = document.getElementById('duration');

let isCapturing = false;
let captureTimer;
const capturedImages = [];
let mediaRecorder;
const recordedChunks = [];

const videoConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "environment"
  }
};

const camSettings = {
  keys: {
    exposureTime:     { abr: 'exp', mode: 'exposureMode', auto: 'continuous', manual: 'manual' },
    colorTemperature: { abr: 'TºK', mode: 'whiteBalanceMode', auto: 'continuous', manual: 'manual' },
    focusDistance:    { abr: 'foc', mode: 'focusMode', auto: 'continuous', manual: 'manual' },
  },
  constraints: {
    video: {
       width: { ideal: 720 },
       height: { ideal: 1280 },
       facingMode: "environment"
    },
    audio: false
  },
  caps: {},
  fps: 30,
  timelapse: 1,
  drawInterval: 1000 / 30,
  track: null,
  init: function(stream){
    this.track = stream.getVideoTracks()[0];
    this.caps = this.track.getCapabilities();
    this.constraints.video = {
      width: videoFeed.videoWidth,
      height: videoFeed.videoHeight,
      facingMode: "environment",
      resizeMode: "crop-and-scale",
      frameRate: { ideal: 30.0, max: 60.0 }
    };
    Object.keys(this.keys).forEach(cap => {
      if (this.caps[cap]){
        ui.setupCap(cap);
      }
    });
    ui.setupCap('timelapse');
  },
  refresh: function(){
    if (!this.track) return;
    this.track.applyConstraints(this.constraints);
    this.drawInterval = 1000 / this.fps;
  }
}

const ui = {
  dialogEl: document.getElementById('dialog'),
  init: function(){
    const close = document.getElementById('dialog-close');
    close.addEventListener('click', () => {
      this.dialogEl.style.display = 'none';
    });
  },
  setupCap: function(capName){
    const id = document.getElementById(capName);
    id.addEventListener('click', () => ui.showDialog(capName));
  },
  showDialog: function(capName){
    const uiEl = document.getElementById(capName);
    let p = `Set ${capName} value:\n`;
    if (camSettings.caps[capName]){
      const cap = camSettings.caps[capName];
      const currentValue = camSettings.track.getSettings()[capName] || 0;
      p += cap.min ? `Min: ${cap.min}\n` : '';
      p += cap.max ? `Max: ${cap.max}\n` : '';
      p += cap.step ? `Step: ${cap.step}\n` : '';
      p += cap instanceof Array ? `Options: ${cap.join(', ')}\n` : '';
      p += `Current: ${currentValue}`;
      const userValue = prompt(p, currentValue);
      this.applyCap(capName, userValue, uiEl);
    } else {
      currentValue = camSettings[capName] || 1;
      const userValue = prompt(p, currentValue);
      camSettings[capName] = parseInt(userValue);
    }
  },
  applyCap: function(capName, userValue, uiEl){
    if (camSettings.keys[capName]){
      const key = camSettings.keys[capName];
      if (userValue === 'auto' && key.auto){
        camSettings.constraints.video[key.mode] = key.auto;
        delete camSettings.constraints.video[capName];
      } else if (key.manual){
        camSettings.constraints.video[key.mode] = key.manual;
        camSettings.constraints.video[capName] = parseInt(userValue);
      } else {
        camSettings.constraints.video[capName] = parseInt(userValue);
      }
    } else {
      camSettings[capName] = parseInt(userValue);
    }
    camSettings.refresh();
    uiEl.querySelector('.ico-label').textContent = `${numValue}`;
  }
}

/*
const settings = {
  FRAME_RATE: 20, // FPS for the final timelapse video (speed)
  DRAW_INTERVAL: 1000 / 20, // Interval between frames in ms
  update: function(){
    this.FRAME_RATE = document.getElementById('fps').value;
    this.DRAW_INTERVAL = 1000 / this.FRAME_RATE;
    this.setConstraint('exptime','exposureTime',0);
    this.setConstraint('temperature','colorTemperature', 2700);
  },
  setConstraint: function(inputId, constraintName, defaultValue){
    const value = parseInt(document.getElementById(inputId).value);
    if (isNaN(value) || value <= defaultValue){
      delete videoConstraints.video[constraintName];
    } else {
      videoConstraints.video[constraintName] = value;
    }
  }
}
*/

// --- 1. Initialize Camera Stream ---
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(camSettings.constraints);
    videoFeed.srcObject = stream;
    camSettings.init(stream);
    statusDisplay.textContent = 'Status: Camera ready.';
  } catch (err) {
    statusDisplay.textContent = 'Status: Error accessing camera. Please ensure permissions are granted.';
    console.error("Error accessing camera: ", err);
  }
}



// --- 2. Camera Capture Functions ---
function captureFrame() {
  // 1. Ensure canvas matches video size for clean capture
  captureCanvas.width = videoFeed.videoWidth;
  captureCanvas.height = videoFeed.videoHeight;

  // 2. Draw the current video frame onto the canvas
  ctx.drawImage(videoFeed, 0, 0, captureCanvas.width, captureCanvas.height);

  // 3. Get the image data URL and store it
  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.8); // 0.8 is quality
  capturedImages.push(dataURL);setConstraint
  const secs = capturedImages.length / camSettings.fps;
  statusDisplay.textContent = `Status: ${capturedImages.length} frame(s). ${secs.toFixed(1)} seconds`;
  if (secs > duration.value){
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
  screen.setLock(true);
  camSettings.refresh();setConstraint
  //settings.update();
  setupCamera();
  const intervalSeconds = parseInt(camSettings.timelapse);
  if (isNaN(intervalSeconds) || intervalSeconds < 1) {
    alert("Please set a valid capture interval (min 1 second).");
    return;
  }

  isCapturing = true;
  //intervalInput.disabled = true;
  timelapseVideo.style.display = 'none';
  capturedImages.length = 0; // Clear previous images

  // Capture the first frame immediately
  captureFrame(); 

  // Set the timer to capture frames repeatedly
  captureTimer = setInterval(captureFrame, intervalSeconds * 1000);
}

function stopCaptureAndGenerate() {
  screen.setLock(false);
  isCapturing = false;
  clearInterval(captureTimer);
  //startStopBtn.textContent = 'Start Capture';
  //intervalInput.disabled = false;

  if (capturedImages.length < 2) {
    statusDisplay.textContent = 'Status: Need at least 2 frames to create a video.';
    return;
  }
  
  // Start the video generation process
  generateTimelapseVideo();
}

// --- 3. MediaRecorder (Video Generation) ---
//const FRAME_RATE = 20; // FPS for the final timelapse video (speed)
//const DRAW_INTERVAL = 1000 / FRAME_RATE; 

async function generateTimelapseVideo() {
  statusDisplay.textContent = 'Status: Generating video... Do not close window.';
  recordedChunks.length = 0;
  // 1. Create a stream from the canvas
  const stream = captureCanvas.captureStream(camSettings.fps); 
  
  // 2. Setup the MediaRecorder
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // 4. Combine chunks into a video blob and display
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
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
    }, camSettings.drawInterval);
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `TL-${Date.now()}.webm`;
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