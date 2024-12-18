Number.prototype.strHex = function(pad, prefix=true){
  pad = pad || Math.floor(Math.log(this)/Math.log(256) + 1) * 2;
  return (prefix ? "0x" : "") + this.toString(16).padStart(pad,'0');
}

let urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get('path');
const uri = urlParams.get('u');
const mimeType = urlParams.get('mime');

const hexv_content = document.getElementById('content');
const hexv_table = document.getElementById('thex');

const hexv_footer = {
  t: document.getElementById('thex'),
  f: document.getElementById('footer'),
  i: document.getElementById('f-hinfo'),
  h: '200px',
  init: function(){
    //this.tHeight = this.t.style.height;
    this.fHeight = this.f.style.height;
    this.cPad = hexv_content.style.paddingBottom;
  },
  isVisible: function(){
    this.e.style.display === 'block';
  },
  setVisibility: function(show){
    hexv_content.style.paddingBottom = show ? this.h : this.cPad;
    this.f.style.height = show ? this.h : this.fHeight;
    this.i.style.display = show ? 'block' : 'hide';
  },
  toggle: function(){
    this.setVisibility(this.i.style.display !== 'block');
  }
}

const hexv_info = {
  optLE:  document.getElementById('hvi-le'),
  optBE:  document.getElementById('hvi-be'),
  optU:   document.getElementById('hvi-u'),
  optS:   document.getElementById('hvi-s'),
  opt8b:  document.getElementById('hvi-8b'),
  opt16b: document.getElementById('hvi-16b'),
  opt32b: document.getElementById('hvi-32b'),
  opt64b: document.getElementById('hvi-64b'),
  opt32f: document.getElementById('hvi-32f'),
  opt64f: document.getElementById('hvi-64f'),
  valDec: document.getElementById('hvi-dec'),
  valHex: document.getElementById('hvi-hex'),
  valBin: document.getElementById('hvi-bin'),
  apply: function(offset){
    let val;
    if (this.opt8b.checked){
      val = this.optU.checked
        ? hex_data.getUInt8(offset)
        : hex_data.getInt8(offset);
    } else if (this.opt16b.checked){
      val = this.optU.checked
        ? hex_data.getUInt16(offset, this.optLE.checked)
        : hex_data.getInt16(offset, this.optLE.checked);
    } else if (this.opt32b.checked){
      val = this.optU.checked
        ? hex_data.getUInt32(offset, this.optLE.checked)
        : hex_data.getInt32(offset, this.optLE.checked);
    } else if (this.opt64b.checked){
      val = this.optU.checked
        ? hex_data.getUInt32(offset, this.optLE.checked)
        : hex_data.getInt32(offset, this.optLE.checked);
      val = parseInt(val);
    } else if (this.opt32f.checked){
      val = hex_data.getFloat32(offset, this.optLE.checked);
    } else if (this.opt64f.checked){
      val = hex_data.getFloat64(offset, this.optLE.checked);
    }
    if (val){
      this.valDec.innerHTML = val;
      this.valHex.innerHTML = val.strHex();
      this.valBin.innerHTML = val.toString(2);
    }
  }
}

hexv_footer.init();

window.onclick = function(event) {
  hexv_footer.setVisibility(false);
}

let hex_reader;
var hex_offset = 0;
var hex_pagesize = 2048;
var hex_rowbytes = 12;
var hex_asciichar = '.';

if (filePath != null){
  loadFile(filePath);
} else {
  showFileInput();
}

function loadFile(path){
  let xhr = new XMLHttpRequest();
  xhr.open("GET", path);
  xhr.responseType = "blob";
  xhr.addEventListener('load', function() {
    let blob = xhr.response;
    if (blob != null){
      blob.lastModifiedDate = new Date();
      blob.name = _filenameFromPath(path);
      DataReader.load(blob, r => {
        hex_data = r;
        updateHexv();
      });
    } else {
      console.log("received null response...");
    }
  });
  xhr.send();
}

function showFileInput(){
  let j = document.getElementById('file-picker');
  let i = document.getElementById('file-input');
  j.style.display = 'block';
  i.onchange = (e) => {
    j.style.display = 'none';
    DataReader.load(e.currentTarget.files[0], r => {
      hex_data = r;
      updateHexv();
    });
  }
}

function byteArrayToTR(offset, arr, tdClass){
  let out = {
    hex: '',
    ascii: ''
  }
  arr.forEach( (v,i) => {
    out.hex += "<td "
      + "id='h" + (offset + i)
      + "' class='" + tdClass + ((i % 4) === 3 ? "s" : "") 
      + "' onclick='tdclick(this)'>" 
      + v.strHex(2,false) + "</td>";
    out.ascii += "<td "
      + "id='a" + (offset + i) 
      + "' class='tda" + hex_rowbytes + "'>"
      + toAsciiStr(v, hex_asciichar) + "</td>";
  });
  return out;
}

function toAsciiStr(char, nonReadableChar){
  nonReadableChar = nonReadableChar || '.';
  return char < 33 || char > 126 ? nonReadableChar : String.fromCharCode(char);
}

function tdclick(e){
  let id = e.id.replace("h","");
  hexv_footer.setVisibility(true);
  console.log("click offset=" + id);
  hexv_info.apply(id);
}

function updateHexv(){
  //var offset = hex_offset;
  let offset_end = Math.min(hex_offset + hex_pagesize, hex_data.source.byteLength);
  //label_offset.innerHTML = hex_offset.strHex(4) + "-" + offset_end.strHex(4);
  let header = document.getElementById('th-data');
  header.replaceChildren();
  header.innerHTML = "<tr><th>offset</th><th colspan='" + (hex_rowbytes + 1) + "'>hex</th><th colspan='" + hex_rowbytes + "'>ascii</th></tr>"
  let table = document.getElementById('tdata');
  table.replaceChildren();
  hex_data.pushOffset(hex_offset);
  let td_class = 'td' + hex_rowbytes;
  let sep = "<td>&nbsp</td>";
  while(hex_data.offset < offset_end){
    let row = _newElement('tr');
    row.innerHTML = "<td class='tdo'>" + hex_data.offset.strHex(8) + "</td>";
    let row_bytes = byteArrayToTR(hex_data.offset, hex_data.readUInt8Array(hex_rowbytes), td_class);
    row.innerHTML += row_bytes.hex + sep + row_bytes.ascii;
    table.appendChild(row);
  }
}

