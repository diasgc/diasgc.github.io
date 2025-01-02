let assetList = ['def-test.frag','def.frag','toy-gyro.frag','toy-MddGWN.frag','toy-mtyGWy.frag'];
let defCode = document.getElementById('defaultFragment').firstChild.nodeValue;;
let fragCode = document.getElementById('fragCode');
let ecode = document.getElementById('ecode');
let edebug = document.getElementById('edebug');
let fname = document.getElementById('fname');
let tr = document.getElementById('opts');
let table = document.getElementById('table');
let sname = document.getElementById('sname');
let webGl = null;
let glcanvas = document.getElementById('gl-canvas');

let opts = [ 'b-clear', 'b-load', 'b-save', 'i-run', 'i-code', 'i-debug','b-ex' ];
opts.forEach(s => {
  let td = document.createElement('td');
  td.width = 100/opts.length + "%";
  if (s.match('b-')){
    let b = document.createElement('div');
    b.innerText = s.replace('b-','');
    b.onclick = function(e){
      if (window[e.currentTarget.innerText])
        window[e.currentTarget.innerText]();
    }
    td.appendChild(b);
  } else if (s.match('i-')){
    let id = s.replace('i-','');
    td.innerHTML = `<input type="checkbox" id="in${id}" name="in${id}" onchange="i${id}(this)"><label for="in${id}">${id}</label>`;
  }
  tr.appendChild(td);
});

loadCode(defCode);

function loadAsset(name){
  fetch(`./shaders/${name}`)
    .then((response) => response.text())
    .then((text) => loadCode(text));
}
function ex(){
  if (document.getElementById('selOpts') !== null)
    return;
  fname.style.display = 'block';
  let sel = document.createElement('select');
  sel.id = 'selOpts';
  sel.className = 'selOpts';
  let opts = "";
  assetList.forEach(item => opts+=`<option value='${item}'>${item}</option>`);
  sel.innerHTML = opts;
  sel.onchange = function(){
    loadAsset(sel.value)
    fname.removeChild(sel);
    fname.style.display = 'none';
  }
  fname.appendChild(sel);
}

function loadCode(code){
  code = GlCanvas.formatCode(code);
  fragCode.innerHTML = code;
  hljs.highlightElement(fragCode);
  hljs.lineNumbersBlock(fragCode,{ singleLine: true });
}

function clear(){
  loadCode(defCode);
}

function irun(i){
  if (i.checked){
    glcanvas.style.display = 'block';
    if (webGl === null){
      webGl = new GlCanvas('gl-canvas');
      webGl.debug('edebug');
      webGl.load({ fragmentCode: fragCode.innerText }, gl => gl.start());
      i.change();
    }
  } else {
    glcanvas.style.display = 'none';
    if (webGl !== null){
      webGl.destroy();
      webGl = null;
    }
    i.change();
  }
}

function icode(i){
  ecode.style.display = i.checked ? 'block' : 'none';
}

function idebug(i){
  if (webGl !== null)
    webGl.debug(i.checked ? 'edebug' : null);
  edebug.style.display = i.checked ? 'block' : 'none';
}

function createTextInput(defVal, labelText, callback){
  let div = document.createElement('div');
  let input = document.createElement('input');
  input.type = 'text';
  input.id = "inputid";
  input.name = input.id;
  input.value = defVal;
  div.appendChild(input);
  let label = document.createElement('label');
  label.setAttribute('for',input.id);
  label.onclick = function(){
    callback(input.value);
  };
  label.innerHTML = labelText;
  div.appendChild(label);
  return div;
}

function save(){
  fname.style.display = 'inline';
  let div = createTextInput("MyFragment.frag","save", filename => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob( [fragCode.innerText], { type : "x-shader/x-fragment;charset=utf-8"	}));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    fname.removeChild(div);
    fname.style.display = 'none';
  })
  fname.appendChild(div);
}

function load(){
  let load = document.createElement('input');
  load.type = 'file';
  load.accept = '.frag';
  load.onchange = function(e){
    var fileReader=new FileReader();
    fileReader.onload=function(){
      loadCode(fileReader.result);
    }
    fileReader.readAsText(this.files[0]);
  }
  document.body.appendChild(load);
  load.click();
  document.body.removeChild(load);
}
function run_old(){
  window.location.href = '/glsl/index.html?frag=' + btoa(fragCode.innerText);
  //window.open("https://www.youraddress.com","_self")
}