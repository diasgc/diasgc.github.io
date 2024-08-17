    const currFacing = 'environment';
    const videoPreview = document.querySelector('#camera');
    const startCam = (facingMode = 'environment') => {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode,
                width: {
                    max: 1920,
                    ideal: 1080
                },
                height: {
                    max: 1080,
                    ideal: 720
                }
            }
        }).then((stream) => {
            videoPreview.srcObject = stream;
        })
    }

    startCam(currFacing);
