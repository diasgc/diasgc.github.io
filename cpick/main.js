var playing = false;
var mask = new Image();
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var video = document.createElement('video');
video.muted = true;
video.autoplay = true;
mask.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Male_head_silhouette.svg/720px-Male_head_silhouette.svg.png";
// stacksnippets don't work well with gUM...
if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video.srcObject = stream;
        video.play();
    });
} else {
  // so we'll use a video about volcanos from wikimedia
  video.crossOrigin = mask.crossOrigin = "anonymous";    
  // wait for the image has loaded
  mask.onload = function() {
    video.src = "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/22/Volcano_Lava_Sample.webm/Volcano_Lava_Sample.webm.360p.webm";
    video.play();
  }
}
video.onplaying = startRendering;
video.onpause = stopRendering;

function startRendering() {
  playing = true;
  requestAnimationFrame( render );
}
function stopRendering() {
  playing = false;
}
function render() {
  context.globalCompositeOperation = "copy";
  context.drawImage(mask, 0, 0, canvas.height * mask.height/mask.width, canvas.height);
  context.globalCompositeOperation = "source-in";
  context.drawImage(video, 0, 0);
  if( playing ) {
    requestAnimationFrame( render );
  }
}


document.getElementById("snap").addEventListener("click", function() {
  var context = document.getElementById("still-canvas").getContext('2d');
   context.drawImage(canvas, 0, 0, 640, 480);
});