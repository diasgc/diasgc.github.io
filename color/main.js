const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const colorDisplay = document.getElementById('color');
function toHex(v){
  return v.toString(16).padStart(2,'0').toUpperCase();
}

const ui = {
  rgba: document.getElementById('rgba'),
  hsla: document.getElementById('hsla'),
  hsva: document.getElementById('hsva'),
  html: document.getElementById('html'),
  post: function(r,g,b,a){
    this.rgba.innerText = `R: ${r}, G: ${g}, B: ${b}`;
    this.html.innerText = `HTML: #${toHex(r)}${toHex(g)}${toHex(b)}`;
    a = (a * 100 / 255).toFixed(0);
    let h, s, l, v;
    [h, s, l] = this.rgbToHsl(r,g,b);
    this.hsla.innerText = `hue: ${(h*360).toFixed(0)} sat: ${(s*100).toFixed(0)}% lum: ${(l*100).toFixed(0)}%`;
    [h, s, v] = this.rgbToHsv(r,g,b);
    this.hsva.innerText = `hue: ${(h*360).toFixed(0)} sat: ${(s*100).toFixed(0)}% val: ${(v*100).toFixed(0)}%`;
  },
  rgbToHsl: function(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if(max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
  },
  rgbToHsv: function(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    } else {
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
  }
}

// Access the camera
navigator.mediaDevices.getUserMedia({ 
    video: {
      facingMode: {ideal: "environment"},
      width: {ideal: 240},
      height: {ideal: 240},
    }
  })
  .then((stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });
  })
  .catch((err) => console.error('Camera access error:', err));

// Draw video to canvas and get pixel color on click
video.addEventListener('click', (event) => {
  //canvas.style.display = 'block';
  // Draw the current video frame to the canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Get the click position relative to the canvas
  const rect = video.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Get pixel data at the clicked position
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const [r, g, b, a] = pixel;

  //canvas.style.display = 'none';
  // Display the color
  ui.post(r,g,b,a);
  video.style.border = `12px solid rgba(${r}, ${g}, ${b}, ${a / 255})`;
});

function copyClip(el){
  const t = el.innerText;
  navigator.clipboard.writeText(t).then(() => {
    alert(`${t} copied to clipboard`);
  }).catch(err => {
    alert(`Failed to copy: ${err}`);
  });
}