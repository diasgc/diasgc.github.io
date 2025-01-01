window.addEventListener("load", startup, false);

const debug = document.getElementById('debug');
const code = document.getElementById('code');

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
}
function toggleDebug(i){
  debug.style.display = i.checked ? 'block' : 'none';
  webGl.debug( i.checked ? 'debug' : null);
}
function toggleCode(i){
  code.style.display = i.checked ? 'block' : 'none';
  code.innerText = webGl.fragmentCode;
}

let webGl;

function startup() {
  webGl = new GlCanvas('gl-canvas');
  webGl.debug('debug');
  let urlParams = new URLSearchParams(window.location.search);
  const frag = urlParams.get('frag');
  if (frag !== null){
    webGl.load({ fragmentCode: atob(frag) }, gl => gl.start());
  } else {
    webGl.load({ fragmentId: 'defaultFragment' }, gl => gl.start());
  }
}
