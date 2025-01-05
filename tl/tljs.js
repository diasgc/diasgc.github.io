if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/tl/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const videoOpts = {
  width: screen.width,
  height: screen.height,
  facingMode: {ideal:"environment"},
}

/*
aspectRatio
autoGainControl
brightness
channelCount
colorTemperature
contrast
deviceId
displaySurface
echoCancellation
exposureCompensation
exposureMode
exposureTime
facingMode
focusDistance
focusMode
frameRate
groupId
height
iso
latency
noiseSuppression
pan
pointsOfInterest
resizeMode
sampleRate
sampleSize
saturation
sharpness
suppressLocalAudioPlayback
tilt
torch
voiceIsolation
whiteBalanceMode
width
zoom
*/

const video = document.getElementById('tl-video');
const log = document.getElementById('log');

navigator.mediaDevices
  .getUserMedia({ video: videoOpts, audio: false })
  .then((stream) => init(stream))
  .catch((err) => {
    console.error(`An error occurred: ${err}`);
  });

function init(stream) {
  video.srcObject = stream;
  video.play();
  const track = stream.getVideoTracks()[0];
  log.innerHTML = JSON.stringify(track.getCapabilities(), null, 2);
}