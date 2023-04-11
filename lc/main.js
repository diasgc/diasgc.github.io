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
        configScreen(caps);
        //console.log(JSON.stringify(caps,null,2));
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

function configScreen(caps){
    let table = document.getElementById('cam-table');
    for (var cap in caps){
        if (caps.hasOwnProperty(cap)){
            let cc = caps[cap];
            if (Object.hasOwn(cc,'min') && Object.hasOwn(cc,'max') && Object.hasOwn(cc,'step')){
                let r = document.createElement('tr');
                let c = r.insertCell();
                let i = document.createElement('input');
                i.id = "cam-" + cap;
                i.type = 'range';
                i.min = cc.min;
                i.max = cc.max;
                i.step = cc.step;
                i.cap = cap;
                i.innerText = JSON.stringify(cap);
                i.onchange = () => {
                    var constraint = {};
                    constraint[i.cap] = i.value;
                    track.applyConstraints({ advanced: [constraint] });
                };
                c.appendChild(i);
                r.appendChild(c);
                let dsc = r.insertCell();
                let ds = document.createElement('div');
                ds.className = 'opt-desc';
                ds.innerHTML = cap;
                r.appendChild(ds);
                table.appendChild(r);
            }
        }
    }
}

playVideoFromCamera();