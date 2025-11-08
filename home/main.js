var level = 3;
const useIcons = true;
const container = document.getElementById('container');

populate(data);

function populate(data){
  Object.keys(data).forEach(k => {
    let h = document.createElement('details');
    h.open = true;
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

function addEntry2(parent, entry){
  let h = document.createElement('div');
  h.className='icon-wrap';
  if (entry['background'])
    h.style=`background: ${entry['background']}`;
  let url  = entry['url'];
  var icon = entry['icon'];
  if (!icon)
    icon = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`;
  h.innerHTML=`<a href="${url}"><img src="${icon}"/></a><p>${entry['name']}</p>`;
  parent.appendChild(h);
}

window.onload = function(){
  let w = new GlCanvas('gl-canvas');
  w.load({fragmentId: 'glsl'}, gl => {
    webGl = gl;
    webGl.start(true);
  });
}