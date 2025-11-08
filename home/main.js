var level = 3;
const useIcons = true;
const container = document.getElementById('container');

populate(data);

function saveState(id){
  localStorage.setItem(id.id, id.open);
}

function loadState(id){
  id.open = localStorage.getItem(id.id) || false;
}

function populate(data){
  Object.keys(data).forEach(k => {
    let h = document.createElement('details');
    h.id = k;
    h.addEventListener('toggle', () => saveState(h));
    loadState(h);
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
  let itemCount = localStorage.getItem('counter') || {};
  if (!itemCount[el.id])
    itemCount[el.id] = 0;
  itemCount[el.id] += 1;
  localStorage.setItem('counter',itemCount);
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
  let w = new GlCanvas('gl-canvas');
  w.load({fragmentId: 'glsl'}, gl => {
    webGl = gl;
    webGl.start(true);
  });
}