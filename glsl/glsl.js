window.addEventListener("load", startup, false);

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
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
