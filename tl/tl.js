const video = document.getElementById('tl-video');
const canvas = document.getElementById('tl-canvas');
const elapsed = document.getElementById('elapsed');

var filename;
var rec;
var timer;
var ctx;
var t0;

const videoOpts = {
  facingMode: {ideal: "environment"},
  resizeMode: "crop-and-scale"
}

function capture(){
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let e = Date.now() - t0;
  elapsed.innerHTML = new Date(e).toISOString().slice(11, 19);
  rec.step(capture);
}

function startStop(){
  if (video.style.display !== 'none'){
    filename = getTimestampFilename()+".webm";
    video.style.display = 'none';
    canvas.style.display = 'block'
    t0 = Date.now();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx = canvas.getContext('2d');
    //timer = setInterval(capture, 1000);
    rec = recordFrames((blob) => saveBlob(blob), canvas, 1);
    rec.init();
    capture();
  } else {
    rec.stop();
    clearInterval(timer);
    video.style.display = 'block';
    canvas.style.display = 'none'
  }
}

function getTimestampFilename(){
  return "tl-" + new Date(Date.now())
    .toISOString()
    .slice(0, 19)
    .replace(/-|:/g,'')
    .replace(/T/g,'-');
}

function saveBlob(blob){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const recordFrames = (onstop, canvas, fps=30) => {
  const chunks = [];

  // get Firefox to initialise the canvas
  canvas.getContext('2d').fillRect(0, 0, 0, 0);

  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream);

  recorder.addEventListener('dataavailable', ({data}) => chunks.push(data));
  recorder.addEventListener('stop', () => onstop(new Blob(chunks)));

  const frameDuration = 1000 / fps;
  
  const frame = (next, start) => {
      recorder.pause();
      api.error += Date.now() - start - frameDuration;
      setTimeout(next, 0); // helps Firefox record the right frame duration
  };

  const api = {
      error: 0,
      init() { 
          recorder.start(); 
          recorder.pause();
      },
      step(next) {
          recorder.resume();
          setTimeout(frame, frameDuration, next, Date.now());
      }, 
      stop: () => recorder.stop()
  };

  return api;
}

function init(stream){
  window.stream = stream;
  video.srcObject = stream;
  video.play();
}

navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => init(stream))
  .catch((err) => {
    log.innerText = `An error occurred: ${err}`;
  });