const front = false;

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                facingMode: front ? "user" : "environment"
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
                        zoom: 8
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