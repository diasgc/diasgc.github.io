const videoFeed = document.getElementById('videoFeed');
const captureCanvas = document.getElementById('captureCanvas');
const timelapseVideo = document.getElementById('timelapseVideo');
const startStopBtn = document.getElementById('startStop');
const intervalInput = document.getElementById('interval');
const statusDisplay = document.getElementById('status');
const ctx = captureCanvas.getContext('2d');

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

const settings = {
    FRAME_RATE: 20, // FPS for the final timelapse video (speed)
    DRAW_INTERVAL: 1000 / 20, // Interval between frames in ms
    update: function(){
        this.FRAME_RATE = document.getElementById('fps').value;
        this.DRAW_INTERVAL = 1000 / this.FRAME_RATE;
    }
}

// --- 1. Initialize Camera Stream ---
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        videoFeed.srcObject = stream;
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
    capturedImages.push(dataURL);
    
    statusDisplay.textContent = `Status: ${capturedImages.length} frame(s). ${capturedImages.length / settings.FRAME_RATE} seconds`;
}

function startCapture() {
    settings.update();
    const intervalSeconds = parseInt(intervalInput.value);
    if (isNaN(intervalSeconds) || intervalSeconds < 1) {
        alert("Please set a valid capture interval (min 1 second).");
        return;
    }

    isCapturing = true;
    intervalInput.disabled = true;
    timelapseVideo.style.display = 'none';
    capturedImages.length = 0; // Clear previous images

    // Capture the first frame immediately
    captureFrame(); 

    // Set the timer to capture frames repeatedly
    captureTimer = setInterval(captureFrame, intervalSeconds * 1000);
}

function stopCaptureAndGenerate() {
    isCapturing = false;
    clearInterval(captureTimer);
    //startStopBtn.textContent = 'Start Capture';
    intervalInput.disabled = false;

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
    const stream = captureCanvas.captureStream(settings.FRAME_RATE); 
    
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
        }, settings.DRAW_INTERVAL);
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

// Initial camera setup
setupCamera();