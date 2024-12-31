window.addEventListener("load", startup, false);

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
}

let webGl;

function startup() {
  webGl = new GlCanvas('gl-canvas');
  let urlParams = new URLSearchParams(window.location.search);
  const frag = urlParams.get('frag');
  if (frag !== null){
    webGl.loadCode(null, atob(frag), gl => gl.start());
  } else {
    webGl.loadAssets(null,'toy-gyro.frag', gl => gl.start());
  }
}
