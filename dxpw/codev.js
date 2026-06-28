Number.prototype.strHex = function(pad){
  return "0x" + this.toString(16).padStart(pad,'0');
}

const { PDFDocument } = PDFLib

let urlParams = new URLSearchParams(window.location.search);
const filePath = urlParams.get('path');
const uri = urlParams.get('u');
const mimeType = urlParams.get('mime');

const header = document.getElementById('header');
const content = document.getElementById('content');
const footer = document.getElementById('footer');
const popupMenu = document.getElementById('popupMenu');
const popupContent = document.getElementById('popupContent');
const label_offset = document.getElementById('opt-offsetcurr');

const tab_stat = configureTab('stat');
const tab_meta = configureTab('meta');
const tab_code = configureTab('code');
const tab_hexv = configureTab('hexv');

var hex_offset = 0;
var hex_pagesize = 2048;
var hex_rowbytes = 8;
var hex_asciichar = '.';

var hex_data;

function configureTab(tag){
  let tab = document.getElementById('tab-' + tag);
  tab.tag = tag;
  tab.style.display = 'none';
  tab.divId = 'div-' + tag;
  let div = document.getElementById(tab.divId);
  div.style.display = 'none';
  tab.addEventListener('click', function(e) {
    clearTabs();
    e.currentTarget.className += ' active';
    let d = document.getElementById(e.currentTarget.divId);
    d.style.display = 'block';
    tabs.currentTag = e.currentTarget.tag;
    footer.style.display = configFooter(e.currentTarget.tag);
  }, false);
  return {
    tab: tab,
    div: div,
    tag: tag,
    showTab: function(){
      this.tab.style.display = 'block';
    },
    showDiv: function(){
      this.div.style.display = 'block';
    },
    
  }
}

function clearTabs(){
  // reset all
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".tab-button").forEach(el => el.className = el.className.replace(" active", ""));
  document.querySelectorAll(".tab-opts").forEach(el => el.style.display = "none");
}

function configFooter(tag){
  if (tag == 'hexv' || tag == 'code'){
    let d = document.getElementById("opts-"+tag);
    d.style.display = 'block';
    return 'block';
  }
  return 'none';
}

const tabs = {
  tab_stat: tab_stat,
  tab_meta: tab_meta,
  tab_code: tab_code,
  tab_hexv: tab_hexv,
  currentTag: null,
  getTab: function(tag){
    switch(tag){
      case 'stat': return this.tab_stat;
      case 'meta': return this.tab_meta;
      case 'code': return this.tab_code;
      case 'hexv': return this.tab_hexv;
    }
    return null;
  },
  getCurrentTab: function(){
    return this.getTab(this.currentTag);
  }
}

const stat = JSON.parse(android.requestAction("gsonStat",filePath));


window.onclick = function(event) {
  if (event.target == popupMenu) {
    popupMenu.style.display = "none";
  }
}

if (stat != null || stat.length > 0){
  tab_stat.showTab();
  tab_stat.src = stat;
  tab_stat.path = '';
  walkOnPath(tab_stat);
  tab_stat.tab.click();
  
  if (stat.canRead){
    getFile("file://" + stat.path, (file) => parseFile(file));
  }
}

function walkOnPath(tab){
  tab.div.replaceChildren();
  let obj = getObjectFromPath(tab.src, tab.path);
  Object.entries(obj).forEach(([key, val]) => {
    let item = getItem(tab, key, val);
    tab.div.appendChild(item);
  });
}

function onBackPressed(){
  let t = tabs.getCurrentTab();
  console.log("onBackPressed(): tab=" + t.tag + " with path:"+t.path);
  if (t.path && t.path.length > 1){
    let parent = t.path.substring(0, t.path.lastIndexOf('/'));
    console.log("onBackPressed(): oldPath="+t.path+" newPath="+parent);
    t.path = parent;
    walkOnPath(t);
  } else {
    android.requestAction("exit","");
  }
}

function getObjectFromPath(src, path){
  var out = src;
  if (path.length == 0 || path == '/')
    return out;
  let segs = path.substring(1).split('/');
  for (let i = 0 ; i < segs.length; i++){
    out = out[segs[i]];
    //console.log("getObjectFromPath: idx="+i+" seg="+segs[i]+" out="+JSON.stringify(out));
    if (out == null)
      return src;
  }
  return out;

}

function getItem(tab, key, val){
  let outKey, outVal;
  let t = Object.prototype.toString.call(val);
  var hasChildren = false;
  if (t === '[object Object]'){
    hasChildren = true;
    if (key.indexOf('|') > 0){
      let kv = key.split('|');
      outVal = kv[1];
      outKey = kv[0];
    } else {
      //console.log("now val is " + val);
      outKey = Object.keys(val).length  + " items";
      outVal = key;
    }
  } else if (t === '[object Array]'){
    let hasObj = val.some( value => { return typeof value == "object" });
    if (!hasObj){
      let maxObjLen = Math.max(...(val.map(v => v.toString().length)));
      if (maxObjLen < 4){
        if (val.length > 8){
          outVal = itemCreateTable(val, maxObjLen);
          //console.log("key " + key + " create table: " + outVal);
          outKey = key;
        } else {
          //console.log("key " + key + " is array of short values, short list: " + JSON.stringify(val));
          outVal = val.join(" ");
          outKey = key;
        }
      } else {
        //console.log("key " + key + " is array of long values " + maxObjLen + ": "+ JSON.stringify(val));
        hasChildren = true;
        outKey = val.length + " items";
        outVal = key;
      }
    } else {
      //console.log("key " + key + " is array of mixed obj/values: " + JSON.stringify(val));
      hasChildren = true;
      outKey = val.length + " items";
      outVal = key;
    }
  } else {
    outKey = key;
    outVal = val == null || val.length == 0 
      ? "<i>(" + key + " is empty)</i>"
      : val.toString().replace(/\0/g, '');
  }
  
  let item = _newElement('div', 'list-item');
  item.hasChildren = hasChildren;
  if (hasChildren)
    item.appendChild(_newElement('div','dir-mark'));

  let r = _newElement('div', "item-text");
  r.appendChild(_newElement('div', "item-title", outVal));
  r.appendChild(_newElement('div', "item-subtitle", outKey));
  item.appendChild(r);

  if (outVal.match(/^https?:\/\//))
    item.url = outVal.replaceAll("http:","https:");
    
  item.key = key;
  item.val = val;
  item.tag = tab.tag;
  item.path = tab.path + '/' + key;
  
  item.addEventListener('click', function(event){
    
    let item = event.currentTarget;
    
    if (item.hasChildren){
      let t = tabs.getTab(item.tag);
      t.path = item.path;
      walkOnPath(t);

    } else if (item.url){
      window.location.assign(item.url);

    } else if (item.key.match("offset") && parseInt(item.val) < hex_data.byteLength){
      hex_offset = parseInt(item.val);
      console.log("change hexview_offset to: " + hex_offset + " max is " + hex_data.byteLength);
      hexview();
      tabs.tab_hexv.tab.click();
    }
  } , false);
  return item;
}

function itemCreateTable(arr, arrStrLen){
  let div = _newElement('div');
  let tb = _newElement('table','table-a');
  let itemsPerRow = (12 / arrStrLen) & 0xff;
  var i = 0;
  while (true){
    let tr = _newElement('tr','tr-a');
    for (let j = 0 ; j < itemsPerRow; j++){
      if (i >= arr.length)
        break;
      let td = _newElement('td','td-a', "" + arr[i++]);
      td.width = itemsPerRow / 100 + "%";
      tr.appendChild(td);
    }
    tb.appendChild(tr);
    if (i >= arr.length)
      break;
  }
  div.appendChild(tb);
  return div.innerHTML;
}

function getFile(path, callback){
  console.log("get file " + path);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", path);
  xhr.responseType = "blob";
  xhr.addEventListener('load', function() {
    let blob = xhr.response;
    if (blob != null){
      blob.lastModifiedDate = new Date();
      blob.name = _filenameFromPath(path);
      console.log("got blob, non-null, name:" + blob.name);
      let fileReader = new FileReader();
      fileReader.onload = (event) => {
        hex_data = new DataView(event.target.result, 0, blob.size);
        hexview();
        tab_hexv.showTab();
        callback(blob);
      };
      fileReader.readAsArrayBuffer(blob);
    } else {
      console.log("received null response...");
    }
  });
  xhr.send();
}



function parseFile(file){

  let isImage = file.type.match("^image/");
  if (isImage || file.type.match("^audio/") || file.type.match("^video/")){
    tab_meta.src = { mediaInfo: "" };
    tab_meta.path = '';
    if (isImage)
      metaJpeg(file);
    metaMediaInfo(file);
  } else if (file.type.match("pdf")) {
    metaPdf(file);
  } else if (file.type.match("font")) {
    metaFont(file);
  } else if (file.name.match(".so") || file.type.match("sharedlib")) {
    metaElf(file);
  } else if (file.type.match('json')){
    metaJson(file);
    parseCode(file);
  } else if (file.type.match('xml')){
    metaXml(file);
    parseCode(file);
  } else {
    codes=[ "text/","java","htm", "shell", "script", "cmake", "make" ];
    for (let i = 0; i < codes.length; i++) {
      if (file.type.indexOf(codes[i]) !== -1) {
        parseCode(file);
        break;
      }
    }
  }
}

function addItem(root, key, val){

  var childData, outKey, outVal;
  let t = Object.prototype.toString.call(val);

  if (t === '[object Array]'){
    console.log("key " + key + " is array: " + JSON.stringify(val));
    outVal = objArrayToValue(key, val);
    outKey = key;
  } else if (t === '[object Object]'){
    console.log("key " + key + " is object: " + JSON.stringify(val));
    childData = val;
    outKey = val.length + " items";
    outVal = key;
  } else {
    //console.log("key " + key + " is value: " + val.toString());
    outKey = key;
    outVal = val.toString();;
  }

  let item = _newElement('div', 'list-item');
  if (childData){
    item.childData = childData;
    item.appendChild(_newElement('div','dir-mark'));
  }

  let r = _newElement('div', "item-text");
  r.appendChild(_newElement('div', "item-title", outVal));
  r.appendChild(_newElement('div', "item-subtitle", outKey));
  item.appendChild(r);
  item.key = key;
  item.val = val;
  if (root.id)
    item.rootId = root.id;
  item.addEventListener('click', itemClickListener, false);
  root.appendChild(item);
}

function objArrayToValue(key,val){
  let isAscii = testArrayAscii(val);
  var sval = val.map( (x) => {
    if (key.match("GPS*"))
      return x.toString().padStart(3,' ');
    return isAscii ? String.fromCharCode(x) : x.toString(16).padStart(2,'0');
  }).join(isAscii ? '' : ' ');
  if (isAscii){
    try {
      let jval = JSON.parse(sval);
      if (typeof jval == "object"){
        populate(parent, jval);
        return;
      }
    } catch {}
  }
  return val;
}

function itemClickListener(event){
  let item = event.currentTarget;
  //console.log("itemClick: root.id="+item.rootId+" data:"+item.childData);
  console.log("itemClick: val="+item.val+" isUrl:"+item.val.match("http"));
  if (item.childData && item.rootId){
    populate(document.getElementById(item.rootId), item.childData);
  } else if (item.val.toString().startsWith("https://")){
    window.location.assign(item.val);
  } else if (item.key.match("offset") && parseInt(item.val) < hex_data.byteLength){
    hex_offset = parseInt(item.val);
    tabs.tab_hexv.click();
  } else if (android){
    android.onItemClick(event.currentTarget.key, event.currentTarget.val);
  }
}

function populate(root, obj){
  root.replaceChildren();
  Object.entries(obj).forEach(([key, val]) => {
    addItem(root, key, val);
  });
}


//#region METADATA
function metaFont(file){
  tab_meta.path = '';
  DataReader.withDataView(hex_data, (r) => {
    let js_font = new MetadataFont(r);
    //js_font.load(r);
    tab_meta.src = js_font.getNames();
    tab_meta.src.header = js_font.header;
    walkOnPath(tab_meta);
    tab_meta.showTab();
    console.log("is font");
  });
  
}

function metaElf(file){
  tab_meta.path = '';
  DataReader.withDataView(hex_data, (r) => {
    js_elf.load(r);
    tab_meta.src = js_elf.translate();
    walkOnPath(tab_meta);
    tab_meta.showTab();
    console.log("is elf");
  });
}

function metaJpeg(file){
  tab_meta.path = '';
  DataReader.withDataView(hex_data, (r) => {
    let metaJpeg = new MetadataImage(r);
    tab_meta.src.Image = metaJpeg.metadata;
    walkOnPath(tab_meta);
    tab_meta.showTab();
    console.log("is elf");
  })
}

function metaJson(file){
  (new Blob([file])).text().then( x => {
    tab_meta.path = '';
    tab_meta.src = JSON.parse(x);
    walkOnPath(tab_meta);
    tab_meta.showTab();
    console.log("is json meta");
  });
}

function metaXml(file){
  (new Blob([file])).text().then( x => {
    tab_meta.path = '';
    let parser = new window.DOMParser();
    let xmlDoc = parser.parseFromString(x, file.type);
    tab_meta.src = xml2json(xmlDoc);
    walkOnPath(tab_meta);
    tab_meta.showTab();
    console.log("is xml meta");
  });
}

function xml2json(srcDOM) {
  let children = [...srcDOM.children];
  let jsonResult = {};
  if (!children.length)
    return srcDOM.childNodes[0].nodeValue;
  for (let child of children) {
    let childIsArray = children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1
    if (childIsArray) {
      if (jsonResult[child.nodeName] === undefined) {
        jsonResult[child.nodeName] = [xml2json(child)];
      } else {
        jsonResult[child.nodeName].push(xml2json(child));
      }
    } else {
      jsonResult[child.nodeName] = xml2json(child);
    }
    for (var att, i = 0, atts = child.attributes, n = atts.length; i < n; i++){
      att = atts[i];
      let t = jsonResult[child.nodeName];
      t[att.nodeName] = att.nodeValue;
    }
  }
  return jsonResult;
}

function metaPdf(file){
  let fileReader = new FileReader();
  fileReader.onload = (event) => {
    PDFDocument.load(event.target.result, {
      updateMetadata: false
    }).then( pdfDoc => {
      tab_meta.path = '';
      tab_meta.scr = {
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        pageCount: pdfDoc.getPageCount(),
        creator: pdfDoc.getCreator(),
        keywords: pdfDoc.getKeywords(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate()
      };
      walkOnPath(tab_meta);
      tab_meta.showTab();
      console.log("is pdf");
    });
  };
  fileReader.readAsArrayBuffer(file);
}

function metaMediaInfo(file){
  MediaInfo.mediaInfoFactory(
    { format: 'JSON' },
    (mediainfo) => {
    const readChunk = async (chunkSize, offset) =>
      new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer());
    mediainfo.analyzeData(file.size, readChunk)
      .then( (result) => {
        let m2 = JSON.parse(result);
        tab_meta.src.mediaInfo = m2;
        tab_meta.path = "";
        walkOnPath(tab_meta);
      }).catch( (error) => {
        let err = getItem(tab_meta, "error", error.stack);
        err.style.color = 'red';
        tab_meta.div.appendChild(err);
      })
  });
  tab_meta.showTab();
  console.log("is mediaInfo");
}
//#endregion

//#region CODE CONTENT
function parseCode(file){
  (new Blob([file])).text().then( x => {
    let pre = document.createElement('pre');
    let code = document.createElement('code');
    if (file.type.indexOf("xml") > 0)
      x = prettifyXml(x);
    if (file.type.indexOf("json") > 0)
      x = JSON.stringify(JSON.parse(x), null, 2);
    code.innerHTML = x.replaceAll("<","&lt;").replaceAll(">","&gt;");
    pre.appendChild(code);
    tab_code.div.replaceChildren();
    tab_code.div.appendChild(pre);
    hljs.highlightElement(code);
    tab_code.showTab();
  });
}

function prettifyXml(sourceXml){
  let xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
  let xsltDoc = new DOMParser().parseFromString([
    // describes how we want to modify the XML - indent everything
    '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
    '  <xsl:strip-space elements="*"/>',
    '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
    '    <xsl:value-of select="normalize-space(.)"/>',
    '  </xsl:template>',
    '  <xsl:template match="node()|@*">',
    '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
    '  </xsl:template>',
    '  <xsl:output indent="yes"/>',
    '</xsl:stylesheet>',
  ].join('\n'), 'application/xml');

  let xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xsltDoc);
  let resultDoc = xsltProcessor.transformToDocument(xmlDoc);
  let resultXml = new XMLSerializer().serializeToString(resultDoc);
  return resultXml;
}
//#endregion

//#region HEXVIEW


function hexview(){
  let offset_end = (hex_offset + hex_pagesize);
  label_offset.innerHTML = hex_offset.strHex(4) + "-" + offset_end.strHex(4);
  let table = document.getElementById('tdata');
  table.replaceChildren();
  var offset = hex_offset;
  let tdClass = "data-" + hex_rowbytes;
  const set4BytesPad = hex_rowbytes < 12;
  var line = 0;
  while(offset < offset_end){
    var hexLine = "";
    var asciiLine = "";
    var c, j;
    for (j = 0 ; j < hex_rowbytes; j++){
      let p = offset + j;
      if (p > offset_end)
        break;
      c = hex_data.getUint8(p);
      hexLine += _hexStr(c,2) + " ";
      if ( set4BytesPad && (j % 4) == 3)
        hexLine += "&nbsp;";
      asciiLine += _asciiStr(c,hex_asciichar); //c < 33 || c > 126 ? hex_asciichar : String.fromCharCode(c);
    }
    asciiLine = asciiLine.replaceAll('>','&gt;').replaceAll('<','&lt;');
    let row = (line % 2 == 0)
      ? document.createElement("tr")
      : _newElement('tr','hv-lst');
    row.offset = offset;
    row.addEventListener('click', hexViewRow, false);
    row.appendChild(_newElement("td", 'hvo', _hexStr(offset)));
    row.appendChild(_newElement("td", tdClass, hexLine )); // "<div class='div-hex'>"+hexLine+"</div>"
    row.appendChild(_newElement("td", tdClass, asciiLine)); // "<div class='div-hex'>"+asciiLine+"</div>"
    line += 1;
    offset += hex_rowbytes;
    table.appendChild(row);
  }
}

function hexViewRow(e){
  popupMenu.style.display = "block";
  popupContent.replaceChildren();
  let table = _newElement('table','table-hexinfo');
  let row = _newElement('tr');
  for (let i = 0 ; i < hex_rowbytes; i++)
    row.appendChild(_newElement('th',"th-hexinfo","" + i));
  table.appendChild(row);
  let hdata = _newElement('tr');
  let adata = _newElement('tr','td-ascinfo');
  let dinfo = _newElement('div','div-hexinfo');
  var c;
  let off_start = e.currentTarget.offset;
  let off_end = off_start + hex_rowbytes;
  for (let i = off_start ; i < off_end; i++){
    c = hex_data.getUint8(i);
    let hex = _newElement('td',"data-0",c.strHex(2));
    hex.id = "id-" + i;
    hex.offsets = {
      pos: i,
      start: off_start,
      end: off_end
    };
    hex.div = dinfo;
    hex.addEventListener('click', hexViewRowInfo, false);
    hdata.appendChild(hex);
    adata.appendChild(_newElement('td',"data-0",c < 33 || c > 126 ? hex_asciichar : String.fromCharCode(c)));
  }
  table.appendChild(hdata);
  table.appendChild(adata);
  //let fs = createFieldset('offset: ' + off_start.strHex(8) + " to " + off_end.strHex(8));
  //fs.appendChild(table);
  popupContent.appendChild(table);
  popupContent.appendChild(dinfo);
  document.getElementById("id-" + off_start).click();

}

function _strHex(offset, bits, littleEndian){
  let pad = bits/4;
  let val = bits > 32 
    ? parseInt(hex_data.getBigUint64(offset, littleEndian))
    : bits > 16
      ? hex_data.getUint32(offset, littleEndian)
      : bits > 8
        ? hex_data.getUint16(offset, littleEndian)
        : hex_data.getUint8(offset);
  return "dec: " + val + "<br>hex: 0x" + val.strHex(pad);
}

function hexViewRowInfo(e){
  let div = e.currentTarget.div;
  div.replaceChildren();
  let offsets = e.currentTarget.offsets;
  let u8 = hex_data.getUint8(offsets.pos);
  console.log("offsets: pos=" + offsets.pos + " start="+offsets.start + " end="+offsets.end);
  addItem(div, "offset", offsets.pos.strHex(8));
  addItem(div, "decimal", u8);
  addItem(div, "binary", u8.toString(2).padStart(8,'0'));
  addItem(div, "octal", u8.toString(8).padStart(4,'0'));
  if (offsets.pos < offsets.end){
    addItem(div, "LE uint16", _strHex(offsets.pos, 16, true));
    addItem(div, "BE uint16", _strHex(offsets.pos, 16, false));
    if (offsets.pos < offsets.end - 2){
      addItem(div, "LE uint32", _strHex(offsets.pos, 32, true));
      addItem(div, "BE uint32", _strHex(offsets.pos, 32, false));
      addItem(div, "LE float32", hex_data.getFloat32(offsets.pos, true));
      addItem(div, "BE float32", hex_data.getFloat32(offsets.pos, false));
      if ( offsets.pos < offsets.end - 6){
        addItem(div, "LE uint64", _strHex(offsets.pos, 64, true));
        addItem(div, "BE uint64", _strHex(offsets.pos, 32, false));
        addItem(div, "LE float64", hex_data.getFloat64(offsets.pos, true));
        addItem(div, "BE float64", hex_data.getFloat64(offsets.pos, false));
      }
    }
  }
}

function setOffset(){
  popupMenu.style.display = "block";
  popupContent.replaceChildren();
  let fs = createFieldset("Offset")
  let lab = _newElement('div','range-label', "" + _strHex(hex_offset));
  let range = createInputRange(0, hex_data.byteLength, hex_pagesize, hex_offset, (v) => {
    lab.innerHTML = _strHex(v);
  });
  range.onchange = function(){
    hex_offset = parseInt(range.value);
    hexview();
  }
  fs.appendChild(lab);
  fs.appendChild(range)
  popupContent.appendChild(fs);
}

function setOffsetPrev(){
  hex_offset = Math.max(0, hex_offset - hex_pagesize);
  hexview();
}

function setOffsetNext(){
  hex_offset = Math.min(hex_offset + hex_pagesize, hex_data.byteLength);
  hexview();
}

function setRowbytes(){
  popupMenu.style.display = "block";
  popupContent.replaceChildren();
  let fs = createFieldset("Bytes-per-row");
  let s = createSelectOptions("Bytes-per-row", setRowbytesValue, "" + hex_rowbytes, {
    "8 bytes": "8",
    "12 bytes": "12",
    "16 bytes": "16"
  });
  fs.appendChild(s);
  popupContent.appendChild(fs);
}


function setRowbytesValue(e){
  hex_rowbytes = parseInt(e.currentTarget.value);
  hexview();
  popupMenu.style.display = "none";
}

function setAscii(){
  popupMenu.style.display = "block";
  popupContent.replaceChildren();
  let fs = createFieldset("Non-Printable Char");
  let s = createSelectOptions("Non-printable chars", setAsciiValue, hex_asciichar, {
    "dot": ".",
    "middle-dot": "&#x00b7;",
    "space": "&nbsp;"
  });
  fs.appendChild(s);
  popupContent.appendChild(fs);
}

function setAsciiValue(e){
  hex_asciichar = e.currentTarget.value;
  hexview();
  popupMenu.style.display = "none";
}

//#endregion

//#region HELPERS

function createSelectOptions(title, onchangeCallback, defValue, objOpts){
  let sel = _newElement('select');
  let grp = _newElement('optgroup');
  grp.label = title;
  Object.keys(objOpts).forEach( key => {
    let opt = _newElement('option',null, key);
    opt.value = objOpts[key];
    if (opt.value === defValue)
      opt.selected = 'selected'
    grp.appendChild(opt);
  })
  sel.addEventListener('change', onchangeCallback);
  sel.appendChild(grp);
  return sel;
}

function createFieldset(title){
  let fs = _newElement('fieldset');
  let lg = _newElement('legend',null, title);
  fs.appendChild(lg);
  return fs;
}

function createInputRange(min=0, max=100, step=1, defVal=0, callback){
  let range = _newElement('input','range-input');
  range.type = 'range';
  range.min = min;
  range.max = max;
  range.step = step;
  range.value = defVal;
  range.oninput = function(){
    callback(range.value);
  }
  return range;
}

function createElement(tag, id, cls, html) {
  let e = document.createElement(tag);
  if (id != null)    e.id = id;
  if (cls != null)   e.className = cls;
  if (inner != null) e.innerHTML = html;
  return e;
}

function appendToElement(el, tag, id, cls, html){
  el.appendChild(_newElement(tag, id, cls, html));
}

function testArrayAscii(arr){
  var c;
  for (var i=0; i < arr.length; i++){
    c = arr[i];
    if (!Number.isInteger(c) && ( c < 32 || c > 126 ))
      return false;
  }
  return true;
}
//#endregion