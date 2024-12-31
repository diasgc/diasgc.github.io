window.addEventListener("load", startup, false);

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
}
function toggleDebug(i){
  if (i.checked){
    document.getElementById('debug').style.display = 'block';
    webGl.debug('debug');
  } else {
    document.getElementById('debug').style.display = 'none';
    webGl.debug(null);
  }
  
}
function toggleCode(i){
  let code = document.getElementById('code');
  if (i.checked){
    code.style.display = 'block';
    code.innerText = webGl.fragmentCode;
  } else {
    code.style.display = 'none';
  }
}

let webGl;

function startup() {
  webGl = new GlCanvas('gl-canvas');
  webGl.debug('debug');
  let urlParams = new URLSearchParams(window.location.search);
  const frag = urlParams.get('frag');
  if (frag !== null){
    webGl.loadCode(null, atob(frag));
    webGl.start();
  } else {
    webGl.loadAssets(null,'def-test.frag', gl => gl.start());
  }
}
