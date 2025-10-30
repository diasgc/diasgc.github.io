const videoFeed = document.getElementById('videoFeed');
const captureCanvas = document.getElementById('captureCanvas');
const timelapseVideo = document.getElementById('timelapseVideo');
const startStopBtn = document.getElementById('startStop');
//const intervalInput = document.getElementById('interval');
const statusDisplay = document.getElementById('status');
const ctx = captureCanvas.getContext('2d');
//const duration = document.getElementById('duration');

const vrs = new URL(document.currentScript.src).searchParams.get("v");

let isCapturing = false;
let captureTimer;
const capturedImages = [];
let mediaRecorder;
const recordedChunks = [];

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
  iso: { cam: true, abr: 'iso', defVal: 'auto', svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M456-600h320q-27-69-82.5-118.5T566-788L456-600Zm-92 80 160-276q-11-2-22-3t-22-1q-66 0-123 25t-101 67l108 188ZM170-400h218L228-676q-32 41-50 90.5T160-480q0 21 2.5 40.5T170-400Zm224 228 108-188H184q27 69 82.5 118.5T394-172Zm86 12q66 0 123-25t101-67L596-440 436-164q11 2 21.5 3t22.5 1Zm252-124q32-41 50-90.5T800-480q0-21-2.5-40.5T790-560H572l160 276ZM480-480Zm0 400q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/></svg>' },
  timelapse: { value: 2, cam: false, abr: 'speed', defVal: 2, svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M610-760q-21 0-35.5-14.5T560-810q0-21 14.5-35.5T610-860q21 0 35.5 14.5T660-810q0 21-14.5 35.5T610-760Zm0 660q-21 0-35.5-14.5T560-150q0-21 14.5-35.5T610-200q21 0 35.5 14.5T660-150q0 21-14.5 35.5T610-100Zm160-520q-21 0-35.5-14.5T720-670q0-21 14.5-35.5T770-720q21 0 35.5 14.5T820-670q0 21-14.5 35.5T770-620Zm0 380q-21 0-35.5-14.5T720-290q0-21 14.5-35.5T770-340q21 0 35.5 14.5T820-290q0 21-14.5 35.5T770-240Zm60-190q-21 0-35.5-14.5T780-480q0-21 14.5-35.5T830-530q21 0 35.5 14.5T880-480q0 21-14.5 35.5T830-430ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880v80q-134 0-227 93t-93 227q0 134 93 227t227 93v80Zm0-320q-33 0-56.5-23.5T400-480q0-5 .5-10.5T403-501l-83-83 56-56 83 83q4-1 21-3 33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Z"/></svg>' },
  duration: { value: 60, cam: false, abr: 'timer', defVal: 60, svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M360-840v-80h240v80H360ZM480-80q-75 0-140.5-28.5T225-186q-49-49-77-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q63 0 120 21t104 59l58-58 56 56-56 58q36 47 57 104t21 120q0 74-28 139.5T735-186q-49 49-114.5 77.5T480-80Zm0-360Zm0-80h268q-18-62-61.5-109T584-700L480-520Zm-70 40 134-232q-59-15-121.5-2.5T306-660l104 180Zm-206 80h206L276-632q-42 47-62.5 106.5T204-400Zm172 220 104-180H212q18 62 61.5 109T376-180Zm40 12q66 17 128 1.5T654-220L550-400 416-168Zm268-80q44-48 63.5-107.5T756-480H550l134 232Z"/></svg>'},
  exposureTime: { cam: true, abr: 'exp', defVal: 'auto', mode: 'exposureMode', auto: 'continuous', manual: 'manual', svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560L200-200Zm380-40v-80h-80v-60h80v-80h60v80h80v60h-80v80h-60ZM240-620h200v-60H240v60Z"/></svg>' },
  colorTemperature: { cam: true, abr: 'TºK', defVal: 'auto', mode: 'whiteBalanceMode', auto: 'continuous', manual: 'manual', svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-80q-83 0-141.5-58.5T280-280q0-48 21-89.5t59-70.5v-320q0-50 35-85t85-35q50 0 85 35t35 85v320q38 29 59 70.5t21 89.5q0 83-58.5 141.5T480-80Zm-40-440h80v-40h-40v-40h40v-80h-40v-40h40v-40q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240Z"/></svg>' },
  focusDistance:    { cam: true, abr: 'foc', defVal: 'auto', mode: 'focusMode', auto: 'cotl2/tl2.jsntinuous', manual: 'manual', svg: '<svg class="ico-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-360q-42 0-71-29t-29-71v-8q-12 9-25.5 13.5T324-450q-42 0-71-29t-29-71q0-30 16-54t42-36q-26-12-42-36t-16-54q0-42 29-71t71-29q17 0 30.5 4.5T380-812v-8q0-42 29-71t71-29q42 0 71 29t29 71v8q9-7 19.5-11t22.5-6l-53 142q-13-24-36.5-38.5T480-740q-42 0-71 29t-29 71q0 42 29 71t71 29q13 0 24-3t22-8q3 21 19.5 36t39.5 15h138q-13 23-35.5 36.5T636-450q-17 0-30.5-4.5T580-468v8q0 42-29 71t-71 29Zm105-200 135-360h64l137 360h-62l-32-92H679l-32 92h-62Zm112-144h110l-53-150h-2l-55 150ZM480-80q0-74 28.5-139.5T586-334q49-49 114.5-77.5T840-440q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm98-98q57-21 100-64t64-100q-57 21-100 64t-64 100Zm-98 98q0-74-28.5-139.5T374-334q-49-49-114.5-77.5T120-440q0 74 28.5 139.5T226-186q49 49 114.5 77.5T480-80Zm-98-98q-57-21-100-64t-64-100q57 21 100 64t64 100Zm196 0Zm-196 0Z"/></svg>' },
  track: null,
  drawInterval: function(){ return 1000 / this.fps; },
  init: function(stream){
    this.track = stream.getVideoTracks()[0];
    this.caps = this.track.getCapabilities();
    ui.init()
  },
  refresh: function(){
    if (!this.track) return;
    setupCamera();
  }
}

const ui = {
  dialogEl: document.getElementById('dialog'),
  init: function(){
    console.dir(camSettings);
    const e = document.getElementById('div-setup');
    e.replaceChildren();
    
    e.appendChild(this.getDiv('timelapse'));
    e.appendChild(this.getDiv('duration'));
    Object.keys(camSettings.caps).forEach(capName => {
      if (camSettings[capName]){
        e.appendChild(ui.getDiv(capName));
      }
    });
  },
  getDiv: function(capName){
    const cap = camSettings[capName];
    if (!cap) return document.createElement('div');
    const div = document.createElement('div');
    div.classList.add('flex-1', 'ico');
    div.id = capName;
    div.innerHTML = `
      ${cap.svg ? cap.svg + "\n\t": ''}<div class="ico-label" id="${capName}-label">${cap.abr}</div>
    `;
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
      p += cap.min ? `Min: ${cap.min}\n` : '';
      p += cap.max ? `Max: ${cap.max}\n` : '';
      p += cap.step ? `Step: ${cap.step}\n` : '';
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
      } else {
        camSettings.constraints.video[capName] = ui.parseUserValue(userValue);
      }
    } else {
      camSettings[capName].value = parseInt(userValue);
    }
    camSettings.refresh();
    uiEl.querySelector('.ico-label').textContent = `${userValue}`;
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
    statusDisplay.textContent = `Status: Camera ready.\n${JSON.stringify(camSettings.constraints.video)}`;
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
  capturedImages.push(dataURL)
  const secs = capturedImages.length / camSettings.fps;
  statusDisplay.textContent = `Status: ${capturedImages.length} frame(s). ${secs.toFixed(1)} seconds`;
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
  screen.setLock(true);
  camSettings.refresh()
  //settings.update();
  setupCamera();
  const intervalSeconds = parseInt(camSettings.timelapse.value);
  if (isNaN(intervalSeconds) || intervalSeconds < 1) {
    alert("Please set a valid capture interval (min 1 second).");
    return;
  }
  console.dir(camSettings);
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

alert("Timelapse Camera version: " + (vrs ? vrs : 'dev'));