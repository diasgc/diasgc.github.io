// SVG ruler: https://github.com/amitonline/true-ruler

function createRuler(container, callback, options){

  options = options || {};
  let opts = {
    min: options.min || 0,
    max: options.max || 100,
    tickSpacing: options.tickSpacing || 5,
    lineWidth: options.lineWidth || 1,
    topMargin: options.topMargin || 5,
    scaleUnits: options.scaleUnits || 10,
    tickHeightArray: options.tickHeightArray || [20,18,14],
    color: options.color || window.getComputedStyle(container).color
  }
  const padL = window.getComputedStyle(container, null).getPropertyValue('padding-left');
  const padR = window.getComputedStyle(container, null).getPropertyValue('padding-right');

  const divRuler = document.createElement('div');
  divRuler.style.position = 'absolute';
  divRuler.style.setProperty('width',`calc(100% - ${padL} - ${padR})`);
  divRuler.style.overflowX = 'auto';
  divRuler.style.padding = 0;
  container.appendChild(divRuler);
  
  opts.w = opts.max - opts.min;
  const canvas = document.createElement('canvas');
  const width = opts.w * opts.tickSpacing;
  
  
  canvas.width = width;
  canvas.height = divRuler.clientHeight || 50;
  canvas.style.setProperty('padding', `0 50%`);

  divRuler.onscroll = (e) => callback(opts.min + opts.w * e.currentTarget.scrollLeft / width);
  
  
  const tickHeight = Array(opts.scaleUnits).fill(opts.tickHeightArray[opts.tickHeightArray.length - 1]);
  tickHeight[0] = opts.tickHeightArray[0];
  tickHeight[opts.scaleUnits/2] = opts.tickHeightArray[1];

  const ctx = canvas.getContext('2d');
  ctx.scale(1,1);
  ctx.lineWidth = opts.lineWidth;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = opts.color;
  ctx.fillStyle = opts.color;
  ctx.translate(0.5, 0.5);
  ctx.textAlign = 'left';
  ctx.beginPath();

  //base line
  ctx.moveTo(0, opts.topMargin);
  ctx.lineTo(width, opts.topMargin);
  ctx.stroke();
  
  var j = Math.round(opts.min);
  let dmax = opts.max.toString().length * opts.tickSpacing;
  ctx.fillText(opts.min, 2, tickHeight[0] + 15);
  for (let i = 0; i <= width; i += opts.tickSpacing) {
    let th = tickHeight[Math.abs(j % 10)];
    ctx.moveTo(i, opts.topMargin);
    ctx.lineTo(i, opts.topMargin + th);
    ctx.stroke();
    if (th === tickHeight[0]){
      ctx.textAlign = j > opts.min 
         ? j < opts.max ? 'center' : 'right' : 'left';
      ctx.fillText(j, i, th + 15);
    }
    j++;
  }
  ctx.translate(-0.5, -0.5);
  divRuler.appendChild(canvas);
  let m = document.createElement('div');
  m.style.position = 'absolute';
  m.style.width = '1px';
  m.style.height = '50px';
  m.style.borderLeft = '1px solid #b00';
  m.style.left = '50%';
  m.style.top = canvas.style.top;
  container.appendChild(m);
  callback(opts.min);
}