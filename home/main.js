const useIcons = true;

const ui = {
  container: document.getElementById('container'),
  video: document.getElementById('f-video'),
  canvas: document.getElementById('gl-canvas'),
  blur: document.getElementById('d-blur'),
  setup: document.getElementById('setup'),
  opts: document.getElementById('clearCache'),
  show: function(el,display){
    if (el) el.style.display = display;
  },
  showSetup: function(state){
    if (state){
      this.blur.style.zIndex = 2;
      this.show(this.setup,'block');
      this.blur.addEventListener('click',() => ui.showSetup(false));
    } else {
      ui.blur.style.zIndex = -1;
      ui.show(ui.setup, 'none');
      ui.blur.removeEventListener('click', () => ui.showSetup(false));
    }
  },
}


const settings = {
  show: false,
  background: 'camera'
}

populate(data);

function setDisplay(id,display){
  const e = document.getElementById(id);
  if (e) e.style.display = display;
}

function saveState(id){
  if (id.open)
    localStorage.setItem(id.id, true);
  else
    localStorage.removeItem(id.id);
}

function loadState(id){
  id.open = localStorage.getItem(id.id) === true ? true : null;
}

function toggleSettings(){
  settings.show = !settings.show;
  ui.showSetup(settings.show);
  //ui.show(ui.setup, settings.show ? 'block':'none');
}

function backCamera(){
  ui.showSetup(false);
  settings.show = false;
  settings.background = 'camera';
  navigator.mediaDevices.getUserMedia({
    video: {
      width: {ideal: window.width},
      height: {ideal: window.height},
      facingMode: "environment"
    }
  })
  .then((stream) => {
    ui.show(ui.video, 'block');
    ui.show(ui.blur,'block');
    ui.show(ui.canvas, 'none');
    settings.videoStream = stream;
    ui.video.srcObject = stream;
  }).catch((error) => backGlsl());
}

function backGlsl(){
  ui.showSetup(false);
  settings.show = false;
  if (settings.videoStream){
    settings.videoStream.close();
    settings.videoStream = null;
  }
  ui.show(ui.video, 'none');
  ui.show(ui.blur,'none');
  ui.show(ui.canvas, 'block');
  let w = new GlCanvas('gl-canvas');
  w.load({fragmentId: 'shader1'}, gl => {
    webGl = gl;
    webGl.start(true);
  });
}

function clearCache(){
  settings.show = false;
  ui.showSetup(false);
  localStorage.clear();
  populate(data);
}

function populate(data){
  ui.container.replaceChildren();
  Object.keys(data).forEach(k => {
    let h = document.createElement('details');
    h.id = k;
    h.addEventListener('toggle', () => saveState(h));
    h.open = localStorage.getItem(h.id) || null;
    h.innerHTML=`<summary>${k}</summary>`;
    data[k].forEach(value => {
      if (value === 'break')
        h.innerHTML += '<div class="sep"></div>';
      else
        addEntry2(h,value);
    })
    ui.container.appendChild(h);
  })
}

function countClick(el){
  let itemCount = JSON.parse(localStorage.getItem('counter') || "{}");
  if (!itemCount[el.id])
    itemCount[el.id] = 0;
  itemCount[el.id] += 1;
  localStorage.setItem('counter',JSON.stringify(itemCount));
}

function addEntry2(parent, entry){
  let h = document.createElement('div');
  h.className='icon-wrap';
  if (entry['background'])
    h.style=`background: ${entry['background']}`;
  let url  = entry['url'];
  var icon = entry['icon'];
  if (!icon)
    icon = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`;
  h.innerHTML=`<a id="${entry['name']}" href="${url}" onclick="countClick(this)"><img src="${icon}"/></a><p>${entry['name']}</p>`;
  parent.appendChild(h);
}

window.onload = function(){
  if (settings.background === 'camera')
    backCamera();
  else
    backGlsl();
}
