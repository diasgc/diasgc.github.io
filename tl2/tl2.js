const imageInput = document.getElementById('imageInput');
const recordBtn = document.getElementById('recordBtn');
const canvas = document.getElementById('timelapseCanvas');
const videoElement = document.getElementById('timelapseVideo');
const ctx = canvas.getContext('2d');

let images = [];
let mediaRecorder;
const recordedChunks = [];
const FRAME_RATE = 10; // Frames per second for the final video (adjust for speed)
const INTERVAL = 1000 / FRAME_RATE; // Time delay between frames in ms

// --- 1. Load Images ---
imageInput.addEventListener('change', async (e) => {
    images = [];
    recordBtn.disabled = true;
    
    // Load each file as an Image object
    for (const file of e.target.files) {
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            // Wait for the image to load before pushing to array
            await new Promise(resolve => img.onload = resolve);
            images.push(img);
        }
    }

    if (images.length > 0) {
        recordBtn.disabled = false;
        // Optionally set canvas size to the first image's dimensions
        canvas.width = images[0].width;
        canvas.height = images[0].height;
    }
});

// --- 2. Recording Functions ---
recordBtn.addEventListener('click', () => {
    if (images.length === 0) {
        alert('Please select images first.');
        return;
    }
    
    startRecording();
    recordBtn.disabled = true;
    recordBtn.textContent = 'Recording...';
});

function startRecording() {
    const stream = canvas.captureStream(FRAME_RATE);
    
    // Choose the MIME type. 'video/webm' is widely supported.
    const options = { mimeType: 'video/webm' }; 
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        videoElement.src = URL.createObjectURL(blob);
        videoElement.style.display = 'block';
        recordBtn.textContent = 'Recording Complete';
    };

    mediaRecorder.start();
    animateFrames(0); // Start the canvas animation
}

// --- 3. Animation Loop ---
function animateFrames(frameIndex) {
    if (frameIndex >= images.length) {
        // Stop recording once all frames have been processed
        mediaRecorder.stop();
        return;
    }

    // Draw the current image to the canvas
    ctx.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);

    // Schedule the next frame draw
    setTimeout(() => {
        // Ensure the recorder is still active before continuing
        if (mediaRecorder.state === 'recording') {
            animateFrames(frameIndex + 1);
        }
    }, INTERVAL);
}