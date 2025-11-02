const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const colorDisplay = document.getElementById('color');
function toHex(v){
  return v.toString(16).padStart(2,'0').toUpperCase();
}

const color = {
  rgb: [0,0,0],
  hsl: [0,0,0],
  hsv: [0,0,0],
  html: '#000000',
  set: function(r,g,b){
    this.rgb = [ r, g, b];
    this.hsl = this.rgbToHsl(r,g,b);
    this.hsv = this.rgbToHsv(r,g,b);
    this.html = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },
  getHSL: function(){
    return [ this.strHue(this.hsl[0]), this.strP(this.hsl[1]), this.strP(this.hsl[2]) ];
  },
  getHSV: function(){
    return [ this.strHue(this.hsv[0]), this.strP(this.hsv[1]), this.strP(this.hsv[2]) ];
  },
  strHue: function(h){
    return (h * 360).toFixed(0);
  },
  strP: function(v){
    return (v * 100).toFixed(0) + "%";
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
const ui = {
  rgbr: document.getElementById('rgb-r'),
  rgbg: document.getElementById('rgb-g'),
  rgbb: document.getElementById('rgb-b'),
  hslh: document.getElementById('hsl-h'),
  hsls: document.getElementById('hsl-s'),
  hsll: document.getElementById('hsl-l'),
  hsvh: document.getElementById('hsv-h'),
  hsvs: document.getElementById('hsv-s'),
  hsvv: document.getElementById('hsv-v'),
  html: document.getElementById('html'),
  post: function(r,g,b,a){
    color.set(r,g,b);
    this.rgbr.innerText = color.rgb[0];
    this.rgbg.innerText = color.rgb[1];
    this.rgbb.innerText = color.rgb[2];
    let hsl = color.getHSL();
    this.hslh.innerText = hsl[0];
    this.hsls.innerText = hsl[1];
    this.hsll.innerText = hsl[2];;
    let hsv = color.getHSV();
    this.hsvh.innerText = hsv[0];
    this.hsvs.innerText = hsv[1];
    this.hsvv.innerText = hsv[2];

    this.html.innerText = color.html;
  },
  
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
  video.style.border = `12px solid rgba(${r}, ${g}, ${b}, ${a.toFixed(2) / 255})`;
});

function copyClip(t){
  navigator.clipboard.writeText(t).then(() => {
    alert(`${t} copied to clipboard`);
  }).catch(err => {
    alert(`Failed to copy: ${err}`);
  });
}

function ccopy(f){
  switch(f){
    case 'rgb': copyClip(`rgba(${color[f][0]},${color[f][1]},${color[f][2]},255)`); break;
    case 'hsl': copyClip(`hsla(${(color[f][0] * 360).toFixed(0)},${color[f][1].toFixed(2)},${color[f][2].toFixed(2)},1.0)`); break;
    case 'hsv': copyClip(`hsva(${(color[f][0] * 360).toFixed(0)},${color[f][1].toFixed(2)},${color[f][2].toFixed(2)},1.0)`); break;
    case 'html': copyClip(color[f]); break;
  }
}