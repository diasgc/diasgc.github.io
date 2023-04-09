async function playVideoFromCamera() {
    try {
        const constraints = {
            'video': {
                'deviceId': 0,
                'width': {'min': 720},
                'height': {'min': 1280}
                }
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.querySelector('video#localVideo');
        videoElement.srcObject = stream;
    } catch(error) {
        console.error('Error opening video camera.', error);
    }
}

playVideoFromCamera();