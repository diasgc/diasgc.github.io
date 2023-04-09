const front = false;

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                facingMode: front ? "user" : "environment",
                width: {min: 720},
                height: {min: 1280}
                },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        var track = stream.getVideoTracks()[0];
        var caps = track.getCapabilities();
        if (caps.zoom)
            track.applyConstraints({
                advanced: [
                    {
                        zoom: 4
                    }
                ]
            });

        const videoElement = document.querySelector('video#localVideo');
        videoElement.srcObject = stream;
    } catch(error) {
        console.error('Error opening video camera.', error);
    }
}

playVideoFromCamera();