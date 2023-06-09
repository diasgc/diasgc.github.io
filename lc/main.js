const front = false;
const eZoom = document.getElementById('cam-zoom');
var track;
var caps;

async function playVideoFromCamera() {
    try {
        const constraints = {
            video: {
                facingMode: front ? "user" : "environment",
                aspectRatio: { ideal: 1 }
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

function createInput(key, caps){
    let cc = caps[key];
    let d1 = document.createElement('div');
    d1.className = "opt-desc";
    d1.innerHTML = key;
    let d2 = document.createElement('div');
    d2.className = "opt-desc";
    d2.innerHTML = "(default)";
    let i = document.createElement('input');
    i.type = "range";
    if (cc.hasOwn('min')) i.min = cc.min;
    if (cc.hasOwn('max')) i.max = cc.max;
    if (cc.hasOwn('step')) i.step = cc.step;
    i.cap = key;
    i.onchange = () => {
        var constraint = {};
        constraint[i.cap] = i.value;
        d2.innerText = (i.value * 1).toFixed(2);
        track.applyConstraints({ advanced: [constraint] });
    }
    d1.appendChild(i);
    d1.appendChild(d2);
    return d1;
}


function configScreen2(caps){
    let table = document.getElementById('cam-table');
    for (var cap in caps){
        let rh = document.createElement('tr');
        let td = rh.insertCell();
        td.appendChild(createInput(cap,caps));
        rh.appendChild(rh);
        table.appendChild(rh);
    }
}

function configScreen(caps){
    let table = document.getElementById('cam-table');
    for (var cap in caps){
        if (caps.hasOwnProperty(cap)){
            let cc = caps[cap];
            if (Object.hasOwn(cc,'min') && Object.hasOwn(cc,'max')){
                let rh = document.createElement('tr');
                let h = rh.insertCell();
                h.className = 'opt-desc'; 
                h.innerHTML = cap;
                rh.appendChild(h);
                table.appendChild(rh);
                let r = document.createElement('tr');
                let ds1 = document.createElement('div');
                ds1.className = 'opt-desc';
                ds1.innerHTML = "......";
                let i = document.createElement('input');
                i.id = "cam-" + cap;
                i.type = 'range';
                i.min = cc.min;
                i.max = cc.max;
                if (Object.hasOwn(cc,'step'))
                    i.step = cc.step;
                i.cap = cap;
<<<<<<< HEAD
=======
                i.innerText = JSON.stringify(cap);
                if (cap.includes('ontrast')){
                    i.value = cc.max;
                } else if (cap.includes('xposure')){
                    i.value = cc.max;
                }
>>>>>>> aa75c98 (capec)
                i.onchange = () => {
                    var constraint = {};
                    constraint[i.cap] = i.value;
                    ds1.innerText = (i.value * 1).toFixed(2);
                    track.applyConstraints({ advanced: [constraint] });
                };
                let c = r.insertCell();
                c.appendChild(i);
                r.appendChild(c);
                let d1 = r.insertCell();
                d1.appendChild(ds1);
                r.appendChild(d1);
                table.appendChild(r);
            }
        }
    }
}

playVideoFromCamera();