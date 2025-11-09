var level = 3;
const useIcons = true;
const container = document.getElementById('container');

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
  localStorage.setItem(id.id, id.open);
}

function loadState(id){
  id.open = localStorage.getItem(id.id) === true ? true : null;
}

function toggleSettings(){
  settings.show = !settings.show;
  setDisplay('setup', settings.show ? 'block':'none');
}

function backCamera(){
  settings.background = 'camera';
  navigator.mediaDevices.getUserMedia({
    video: {
      width: {ideal: window.width},
      height: {ideal: window.height},
      facingMode: "environment"
    }
  })
  .then((stream) => {
    let videoFeed = document.getElementById('f-video');
    setDisplay('f-video','block');
    setDisplay('d-blur', 'block');
    setDisplay('gl-canvas','none');
    settings.videoStream = stream;
    videoFeed.srcObject = stream;
  }).catch((error) => backGlsl());
}

function backGlsl(){
  if (settings.videoStream){
    settings.videoStream.close();
    settings.videoStream = null;
  }
  setDisplay('f-video', 'none');
  setDisplay('d-blur', 'none');
  setDisplay('gl-canvas','block');
  let w = new GlCanvas('gl-canvas');
  w.load({fragmentId: 'shader1'}, gl => {
    webGl = gl;
    webGl.start(true);
  });
}

function clearCache(){
  localStorage.clear();
  populate(data);
}

function populate(data){
  container.replaceChildren();
  Object.keys(data).forEach(k => {
    let h = document.createElement('details');
    h.id = k;
    h.addEventListener('toggle', () => localStorage.setItem(h.id, h.open));
    h.open = localStorage.getItem(h.id) || null;
    h.innerHTML=`<summary>${k}</summary>`;
    data[k].forEach(value => {
      if (value === 'break')
        h.innerHTML += '<div class="sep"></div>';
      else
        addEntry2(h,value);
    })
    container.appendChild(h);
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
