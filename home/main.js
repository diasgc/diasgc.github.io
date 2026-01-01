if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/home/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}


const useIcons = true;

const ui = {
  container: document.getElementById('container'),
  video: document.getElementById('f-video'),
  canvas: document.getElementById('gl-canvas'),
  blur: document.getElementById('d-blur'),
  setup: document.getElementById('setup'),
  opts: document.getElementById('clearCache'),
  themeDark: true,
  show: function(el,display){
    if (el) el.style.display = display;
  },
  showSetup: function(state){
    if (state){
      this.blur.style.zIndex = 2;
      this.show(this.setup,'block');
      this.setup.addEventListener('click',() => ui.showSetup(false));
    } else {
      ui.blur.style.zIndex = -1;
      ui.show(ui.setup, 'none');
      ui.setup.removeEventListener('click', () => ui.showSetup(false));
    }
  },
  getIconUrl: function(url){
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`;
  },
  toggleTheme: function(){
    let r = document.querySelector(':root');
    ui.themeDark = !ui.themeDark;
    if (ui.themeDark){
      r.style.setProperty('--body-bg', '#111');
      r.style.setProperty('--body-color', '#eee');
      r.style.setProperty('--blur-color', '#1118');
      r.style.setProperty('--border-fg', '#0008');
    } else {
      r.style.setProperty('--body-bg', '#eee');
      r.style.setProperty('--body-color', '#111');
      r.style.setProperty('--blur-color', '#eee4');
      r.style.setProperty('--border-fg', '#fff8');
    }
  }
}


const config = {
  show: false,
  background: 'camera',
  blur: 72,
  saveState: function(id){
    if (id.open)
      localStorage.setItem(id.id, true);
    else
      localStorage.removeItem(id.id);
  },
  loadState: function(h){
    h.open = localStorage.getItem(h.id) || null;
  }
}

function toggleView(){
  config.show = !config.show;
  ui.showSetup(config.show);
}

ui.container.replaceChildren();
populate(data);
populate(extra_data);

function backCamera(){
  ui.showSetup(false);
  config.show = false;
  config.background = 'camera';
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
    config.videoStream = stream;
    ui.video.srcObject = stream;
  }).catch((error) => backGlsl());
}

function backGlsl(){
  ui.showSetup(false);
  config.show = false;
  if (config.videoStream){
    config.videoStream.getTracks().forEach(function(track) {
      track.stop();
    });
    config.videoStream = null;
  }
  ui.show(ui.video, 'none');
  ui.show(ui.blur,'none');
  ui.show(ui.canvas, 'block');
  let w = new GlCanvas('gl-canvas');
  w.load({fragmentId: 'shader2'}, gl => {
    webGl = gl;
    webGl.start(true);
  });
}

function reload(){
  fetch(window.location.href, { cache: 'reload' })
    .then(() => location.reload());
}

function clearCache(){
  config.show = false;
  ui.showSetup(false);
  localStorage.clear();
  populate(data);
}

function populate(data){
  Object.keys(data).forEach(k => {
    let h = document.createElement('details');
    h.id = k;
    h.addEventListener('toggle', () => config.saveState(h));
    config.loadState(h);
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

function addEntry2(parent, entry){
  let h = document.createElement('div');
  h.className='icon-wrap';
  if (entry['background'])
    h.style=`background: ${entry['background']}`;
  let url  = entry['url'];
  let icon = entry['icon'] || ui.getIconUrl(url);
  h.innerHTML=`<a id="${entry['name']}" href="${url}" onclick="countClick(this)"><img src="${icon}"/></a><p>${entry['name']}</p>`;
  parent.appendChild(h);
}

function countClick(el){
  let itemCount = JSON.parse(localStorage.getItem('counter') || "{}");
  if (!itemCount[el.id])
    itemCount[el.id] = 0;
  itemCount[el.id] += 1;
  localStorage.setItem('counter',JSON.stringify(itemCount));
}

window.onload = function(){
  if (config.background === 'camera')
    backCamera();
  else
    backGlsl();
}
