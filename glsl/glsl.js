window.addEventListener("load", startup, false);

function squareit(i){
  webGl.options.square = i.checked;
  webGl.resize();
}

function loadFragment(i){
  webGl.stop();
  var fileReader=new FileReader();
  fileReader.onload=function(){
    webGl.loadCode(null, fileReader.result, gl => gl.start());
  }
  fileReader.readAsText(i.files[0]);
  
}

function loadAsset(i){
  webGl.stop();
  webGl.loadAssets(null, i.value, gl => gl.start());
}

let webGl;

function startup() {
  webGl = new GlCanvas('gl-canvas');
  webGl.loadAssets(null,'toy-gyro.frag', gl => gl.start());
}
