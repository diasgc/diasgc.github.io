Number.prototype.strHex = function(pad, prefix=true){
  pad = pad || Math.floor(Math.log(this)/Math.log(256) + 1) * 2;
  return (prefix ? "0x" : "") + this.toString(16).padStart(pad,'0');
}

Number.prototype.strBin = function(pad, prefix=true, group=true){
  pad = pad || Math.floor(Math.log(this)/Math.log(4) + 1) * 2;
  let ret = this.toString(2).padStart(pad,'0');
  if (group)
    ret = ret.match(/.{1,8}/g).join('&nbsp;');
  return (prefix ? "0b" : "") + ret;
}

Number.prototype.strOct = function(pad, prefix=true){
  pad = pad || Math.floor(Math.log(this)/Math.log(128) + 1) * 2;
  let ret = this.toString(8).padStart(pad,'0');
  return (prefix ? "0" : "") + ret;
}

let urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get('path');
const uri = urlParams.get('u');
const mimeType = urlParams.get('mime');

const hexv_content = document.getElementById('content');
const hexv_table = document.getElementById('thex');
const hexv_f_hoffset = document.getElementById('f-hoffset');
const hexv_f_hinfo = document.getElementById('f-hinfo');
const hexv_input_offset = document.getElementById('hvi-offset');
const hexv_foot = document.getElementById('footer');
const header = document.getElementById('th-data');


let hex_reader;
var hex_offset = 0;
var hex_pagesize = 2048;
var hex_rowbytes = 12;
var hex_asciichar = '.';
var hex_selected = -1;

const hexv_footer = {
  t: document.getElementById('thex'),
  f: document.getElementById('footer'),
  i: document.getElementById('f-hinfo'),
  h_info: '200px',
  h_offs: '100px',
  h_hide: '2px',
  showInfo: function(){
    hexv_f_hinfo.style.display = 'block';
    hexv_f_hoffset.style.display = 'none';
    hexv_foot.style.height = this.h_info;
  },
  showOffset: function(){
    hexv_f_hinfo.style.display = 'none';
    hexv_f_hoffset.style.display = 'block';
    hexv_foot.style.height = this.h_offs;
  },
  hideAll: function(){
    hexv_foot.style.height = this.h_hide;
    hexv_f_hinfo.style.display = 'none';
    hexv_f_hoffset.style.display = 'none';
  }
}

const hexv_cfg = {
  optR8:  document.getElementById('hvi-r8'),
  optR12: document.getElementById('hvi-r12'),
  optR16: document.getElementById('hvi-r16'),
  optCh1: document.getElementById('hvi-ch1'),
  optCh2: document.getElementById('hvi-ch2'),
  optCh3: document.getElementById('hvi-ch3'),
  apply:  function(){
    if (this.optR8.checked)
      hex_rowbytes = 8;
    else if (this.optR12.checked)
      hex_rowbytes = 12;
    else if (this.optR16.checked)
      hex_rowbytes = 16;
    if (this.optCh1.checked)
      hex_asciichar = '.';
    else if (this.optCh2.checked)
      hex_asciichar = '&nbsp;';
    else if (this.optCh3.checked)
      hex_asciichar = '-';
    updateHexv();
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
  opt24b: document.getElementById('hvi-24b'),
  opt64b: document.getElementById('hvi-64b'),
  opt32f: document.getElementById('hvi-32f'),
  opt64f: document.getElementById('hvi-64f'),
  outDec: document.getElementById('hvo-dec'),
  outHex: document.getElementById('hvo-hex'),
  outOct: document.getElementById('hvo-oct'),
  outBin: document.getElementById('hvo-bin'),
  outRgb: document.getElementById('hvo-rgb'),
  outDat: document.getElementById('hvo-dat'),
  outVal: document.getElementById('hvi-val'),
  apply: function(){
    let val, len, showHex = true;
    if (this.opt8b.checked){
      len = 1;
      val = this.optU.checked
        ? hex_data.getUInt8(hex_selected)
        : hex_data.getInt8(hex_selected);
    } else if (this.opt16b.checked){
      len = 2;
      val = this.optU.checked
        ? hex_data.getUInt16(hex_selected, this.optLE.checked)
        : hex_data.getInt16(hex_selected, this.optLE.checked);
    } else if (this.opt24b.checked){
      len = 3;
      val = this.optU.checked
        ? hex_data.getUInt24(hex_selected, this.optLE.checked)
        : hex_data.getInt24(hex_selected, this.optLE.checked);
    } else if (this.opt32b.checked){
      len = 4;
      val = this.optU.checked
        ? hex_data.getUInt32(hex_selected, this.optLE.checked)
        : hex_data.getInt32(hex_selected, this.optLE.checked);
    } else if (this.opt64b.checked){
      len = 8;
      val = this.optU.checked
        ? hex_data.getUInt64(hex_selected, this.optLE.checked)
        : hex_data.getInt64(hex_selected, this.optLE.checked);
      val = parseInt(val);
    } else if (this.opt32f.checked){
      showHex = false;
      len = 4;
      val = hex_data.getFloat32(hex_selected, this.optLE.checked);
    } else if (this.opt64f.checked){
      showHex = false;
      len = 8;
      val = hex_data.getFloat64(hex_selected, this.optLE.checked);
    }
    if (val !== null){
      if (this.outDec.checked)
        this.outVal.innerHTML = val;
      else if (this.outHex.checked)
        this.outVal.innerHTML = val.strHex(len * 2);
      else if (this.outOct.checked)
        this.outVal.innerHTML = val.strOct();
      else if (this.outBin.checked)
        this.outVal.innerHTML = val.strBin();
      else if (this.outRgb.checked){
        let rgb = "#" + val.strHex(len * 2, false);
        this.outVal.innerHTML = "<span class='sp-rgb' style='background-color: " + rgb + ";'></span>" + rgb;
      } else {
        this.outVal.innerHTML = "n/a";
      }
      checkOffset(val, this.outVal);
    }
  }
}

function checkOffset(val, el){
  if (val < hex_data.source.byteLength)
    el.innerHTML += "<span class='chip-offset' onclick='offsetGoTo(" + hex_selected + ")'>offset</span>";
}

function chipColorRgb(val, el, bytes){
  let ch = ['grey','','','rgb','rgba'];
  let rgb = "#" + val.strHex(2 * bytes, false);
  let cls = "chip-color-" + (this.lumOfRgb(val) > 0.5 ? "b" : "w");
  el.innerHTML += "<span class='" + cls + "' style='background: " + rgb + ";'>" + ch[bytes] + "</span>";
}

function lumOfRgb(v){
  if (v > 0xffffff)
    v = (v >> 8);
  let r = (v >> 16) & 0xff;
  let g = (v >> 8) & 0xff;
  let b = v & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 256;
}

function hideFooter(){
  hexv_footer.hideAll();
}

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
        hexv_input_offset.max = hex_data.source.byteLength;
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
      + "' onclick='tdhclick(this)'>"
      + v.strHex(2,false) + "</td>";
    out.ascii += "<td "
      + "id='a" + (offset + i)
      + "' class='tda" + hex_rowbytes
      + "' onclick='tdaclick(this)'>"
      + toAsciiStr(v, hex_asciichar) + "</td>";
  });
  return out;
}

function toAsciiStr(char, nonReadableChar){
  nonReadableChar = nonReadableChar || '.';
  return char < 33 || char > 126 ? nonReadableChar : String.fromCharCode(char);
}

function tdhclick(e){
  let offset = e.id.replace("h","");
  hexv_footer.showInfo();
  newSelection(offset);
  hexv_info.apply();
}

function tdaclick(e){
  let offset = e.id.replace("a","");
  hexv_footer.showInfo();
  newSelection(offset);
  hexv_info.apply();
}

function tdoclick(e){
  hexv_footer.showOffset();
}

function newSelection(offset){
  if (hex_selected !== -1){
    let h_old =  document.getElementById("h" + hex_selected);
    let a_old = document.getElementById("a" + hex_selected);
    h_old.classList.remove('td-sel');
    a_old.classList.remove('td-sel');
  }
  let h_new = document.getElementById("h" + offset);
  let a_new = document.getElementById("a" + offset);
  h_new.classList.add('td-sel');
  a_new.classList.add('td-sel');

  hex_selected = offset;
}

function hcfg(){
  hexv_cfg.apply();
}

function hnfo(){
  hexv_info.apply();
}

function updateHexv(){
  let offset_end = Math.min(hex_offset + hex_pagesize, hex_data.source.byteLength);
  header.replaceChildren();
  header.innerHTML = "<tr onclick='tdoclick(this)'>"
    + "<th>offset</th><th colspan='" + (hex_rowbytes + 1) + "'>hex</th>"
    + "<th colspan='" + hex_rowbytes + "'>ascii</th></tr>"
  let table = document.getElementById('tdata');
  table.replaceChildren();
  hex_data.pushOffset(hex_offset);
  let td_class = 'td' + hex_rowbytes;
  let sep = "<td>&nbsp</td>";
  while(hex_data.offset < offset_end){
    let row = _newElement('tr');
    row.innerHTML = "<td id='o" + hex_data.offset + "' "
      + "class='tdo" + hex_rowbytes + "' "
      + "onclick='tdoclick(this)'>" + hex_data.offset.strHex(8) + "</td>";
    let row_bytes = byteArrayToTR(hex_data.offset, hex_data.readUInt8Array(hex_rowbytes), td_class);
    row.innerHTML += row_bytes.hex + sep + row_bytes.ascii;
    table.appendChild(row);
  }
  hex_data.popOffset();
}



//#region offset NAV
function offsetFirst(){
  hex_offset = 0;
  hexv_input_offset.value = hex_offset.strHex(8);
  updateHexv();
}

function offsetPrev(){
  hex_offset = Math.max(
    0,
    hex_offset - hex_pagesize);
    hexv_input_offset.value = hex_offset.strHex(8);
  updateHexv();
}

function offsetGoTo(offset){
  hex_offset = offset;
  hex_selected = -1;
  hexv_input_offset.value = hex_offset.strHex(8);
  hexv_footer.hideAll();
  updateHexv();
  window.scrollTo(0,1);
}

function offsetChange(e){

}

function offsetNext(){
  hex_offset = Math.min(
    hex_data.source.byteLength - hex_pagesize,
    hex_offset + hex_pagesize);
  hexv_input_offset.value = hex_offset.strHex(8);
  updateHexv();
}

function offsetLast(){
  hex_offset = hex_data.source.byteLength - hex_pagesize - 1;
  hexv_input_offset.value = hex_offset.strHex(8);
  updateHexv();
}
//#endregion




