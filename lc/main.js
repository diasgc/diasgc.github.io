const front = false;
const eZoom = document.getElementById('cam-zoom');
var track;
var caps;

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                facingMode: front ? "user" : "environment"
                },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        track = stream.getVideoTracks()[0];
        caps = track.getCapabilities();
        const videoElement = document.querySelector('video#localVideo');
        videoElement.srcObject = stream;
    } catch(error) {
        console.error('Error opening video camera.', error);
    }
}

function applyZoom(){
    if (caps.zoom)
        track.applyConstraints({ advanced: [{ zoom: eZoom.value * 1 }] });
}

playVideoFromCamera();