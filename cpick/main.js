    const currFacing = 'environment';
    const videoPreview = document.getElementById('camera');
    async function getDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("devices: " + devices);
    }
    getDevices();
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
