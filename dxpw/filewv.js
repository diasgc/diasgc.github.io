const navHeader = document.getElementById('header');
const navBar = document.getElementById('h-nav');
const navFooter = document.getElementById('footer');
const navContent = document.getElementById('content');
const popupMenu = document.getElementById('popupMenu');
const popupContent = document.getElementById('popupContent');
const colorProtected = getComputedStyle(document.body).getPropertyValue('--protected');

const urlParams = new URLSearchParams(window.location.search);
const rootPath = urlParams.has('path') ? urlParams.get('path') : "/";

console.log("rootpath:" + rootPath);
var rootName;

let navTitle = document.getElementById('h-title');
navTitle.innerHTML = android ? android.requestAction("volumeName", rootPath) : "DevXpS"


if (rootPath == '/')
  rootName = "Root";
else if (rootPath == '/storage/emulated/0')
  rootName = "Internal Storage";
else
  rootName = _pathSplitLastSegment(rootPath).name;

pushNavItem(rootName, rootPath);
parseLsList(rootPath, android.requestAction("ls", rootPath));



function navItemClickListener(event){
  let path = event.currentTarget.path;
  console.log("navclick to path = " + path);
  while(navBar.lastChild != event.currentTarget)
    navBar.removeChild(navBar.lastChild);
  parseLsList(path, android.requestAction("ls", path));
}


function parseLsList(parentDir, str){
  navContent.replaceChildren();
  var rows = str.trim().split('\n');
  if (rows.length == 0 || rows[0].indexOf('denied') > 0){
    addEmpty();
    return;
  }
  let fileList = [];
  rows.forEach((row) => {
    if (row != null && row.length > 0){
      let ls = str2ls(parentDir, row);
      if (ls)
        fileList.push(ls);
    }
  })
  fileList.sort((f1,f2) => {
			return f1.isdir == f2.isdir
        ? (f1.name.toUpperCase() > f2.name.toUpperCase() ? 1 : -1)
        : f2.isdir - f1.isdir;
  });
  fileList.forEach((ls) => addLsItem(ls));  
}

function str2ls(parentDir, str){
  if (str.length < 1)
    return null;
  let fields = str.trim().split(',');
  if (fields == null || fields.length == 0)
    return null;
  return {
    parent: parentDir,
    path: parentDir + (parentDir == '/' ? '' : '/') + fields[14],
    type: fields[0],
    permission: fields[1],
    permission_user: fields[2],
    permission_group: fields[3],
    permission_other: fields[4],
    canRead: fields[5] == 0,
    canWrite: fields[6] == 0,
    canExecute: fields[7] == 0,
    hardlinks: fields[8],
    userId: fields[9],
    groupId: fields[10],
    size: fields[11],
    lastModDate: fields[12],
    mimetype: fields[13],
    name: fields[14],
    errno: fields[15],
    symlink: fields[16],
    isdir: fields[0] == 'd' ? 1 : 0,
    isHidden: function() { return this.name.startsWith('.') || !this.canRead },
    hasThumb: function() { return _strMatchWords(this.mimetype, [ "image","audio","video","pdf","font" ]) },
    isDir:  function() { return this.type === 'd' },
    isFile: function() { return this.type === 'f' },
    isLink: function() { return this.type === 'l' },
    isBlock: function() { return this.type === 'b' },
    isChar: function() { return this.type === 'c' },
    isFifo: function() { return this.type === 'p' },
    isSock: function() { return this.type === 's' },
    hasChildren: function() { return this.canRead && this.type === 'd' },
    getExtension: function() {
      let i = this.name.lastIndexOf('.');
      return i < 0 ? "" : this.name.substring(i);
    },
    getSummary:  function() {
      var summary = ""
      if (this.isDir())
        summary += this.hardlinks > 2 ? (this.hardlinks - 2) + " subdirs " : "empty ";
      else if (this.isFile())
        summary += _fmtBytes(this.size);
			if (this.isLink() || this.symlink)
				summary += "-> " + this.symlink;
			if (this.isChar())
				summary += "char ";
			if (this.isFifo())
				summary += "fifo ";
			if (this.isBlock())
				summary += "block ";
			summary += " -  " + _fmtTime(this.lastModDate * 1000, true);
			return summary;
    },
    getStatHeader: function() {
      var statHeader = this.canRead ? "":"protected ";
      statHeader += this.canExecute ? "exec ":"";
      statHeader += this.canWrite ? "":"read-only ";
      return statHeader + " " + this.mimetype;
    },
    getIconTag: function() {
      var iconTag = "w";
      if (this.isDir())
        return "folder";
      else if (this.isFile()){
        let e = this.getExtension();
        if (e.length == 0)
          return "bin";
        if (this.mimetype.match('image'))
          return "image";
        if (this.mimetype.match('video'))
          return "video";
        if (this.mimetype.match('audio'))
          return "audio";
        if (this.mimetype.match('xml'))
          return 'xml';
        if (this.mimetype.match('json'))
          return 'json';
        if (this.mimetype.match('pdf'))
          return 'pdf';
        if (this.mimetype.match('script'))
          return 'text';
        let plangs = ".c.h.cpp.hpp.java.js.rc.sh.bas.py.rb.css.html";
        if (e && plangs.indexOf(e) > 0)
          return 'text';
        return "bin";
      } else if (this.isBlock()){
        return "block";
      } else if (this.isChar()){
        return "char";
      }
      return "w";
    }
  }
}

function addLsItem(stat){
  let item = _newElement('div','list-item');
  item.stat = stat;
  let icon = _newElement('div','icon-' + stat.getIconTag());
  if (!stat.canRead)
    icon.classList.add('item-protected');
  if (stat.isHidden())
    icon.classList.add('item-hidden');
  item.appendChild(icon);
  let r = _newElement('div', "item-text");
  r.appendChild(_newElement('div', "item-title", stat.name));
  if (stat.hasThumb()){
    r.style.paddingTop = '12px';
    if (stat.mimetype.match('image'))
      r.appendChild(thumbImageItem(stat));
    else if (stat.mimetype.match('video'))
      r.appendChild(thumbVideoItem(stat));
    else if (stat.mimetype.match('audio'))
      thumbAudioItem(r, stat);
    else if (stat.mimetype.match('font'))
      r.appendChild(thumbFontItem(stat));
    /*else if (stat.mimetype.match('pdf'))
      thumbPdfItem(stat);*/
    else {
      let img = _newElement('img','img-thumb');
      img.id = stat.name;
      img.alt = 'image';
      if (stat.isHidden())
        img.classList.add('item-hidden');
      onVisible(img, () => img.src = android.requestAction("thumb", stat.path));
      r.appendChild(img);
    }
  }
  r.appendChild(_newElement('div', "item-subtitle", stat.getSummary()));
  r.appendChild(_newElement('div', 'item-stat', stat.getStatHeader()));
  item.appendChild(r);

  item.isSelected = false;
  item.addEventListener('click', fileClickListener, false);
  navContent.appendChild(item);
}

let setting = document.getElementById('h-more');
setting.addEventListener('touchstart', onTouchStart);
setting.addEventListener('touchend', onTouchEnd);

function onTouchStart(e){
  e.preventDefault();
  timerId = setTimeout(selectMode.enter, 1000);
}

function onTouchEnd(e){
  clearTimeout(timerId);
}

var timerId;

function fileClickListener(event){
  let item = event.currentTarget;
  if (modeSelection){
    if (item.isSelected){
      item.isSelected = false;
      item.classList.remove('item-selected');
    } else {
      item.isSelected = true;
      item.classList.add('item-selected');
    }
  } else {
    let stat = item.stat;
    if (stat.isDir() && android){
      pushNavItem(stat.name, stat.path);
      parseLsList(stat.path, android.requestAction("ls", stat.path));
    } else
      modalMenu(event);
  }
}

function onBackPressed(){
  console.log("selectMode: " + selectMode.active);
  if (modeSelection){
    selectMode.exit();
    return;
  }
  if (navBar.firstChild == navBar.lastChild){
    android.requestAction("exit", null);
  } else {
    navBar.removeChild(navBar.lastChild);
    let path = navBar.lastChild.path;
    if (android)
      parseLsList(path, android.requestAction("ls", path));
  }
}

function pushNavItem(name, path){
  console.log("pushNavItem path="+path);
  let d = _newElement('span', 'header-item', "<span class='header-item-mark'>&gt;</span>" + name);
  d.path = path;
  d.onclick = navItemClickListener;
  navBar.appendChild(d);
}

var modeSelection = false;

let selectMode = {
  active: false,
  enter: function(){
    if (!modeSelection){
      navHeader.classList.add('c-header-selected');
      navFooter.style.display = 'block'
      modeSelection = true;
      console.log("enter select mode: " + this.active);
    }
  },
  exit: function(){
    if (modeSelection){
      console.log("exit select mode: " + this.active);
      navHeader.classList.remove('c-header-selected');
      modeSelection = false;
      navFooter.style.display = 'none';
      let el = document.querySelectorAll('.item-selected');
      if (el != null && el.length > 0)
        el.forEach((item) => item.classList.remove('item-selected'));
    }
  }
}

const longPress = {
  item: 0,
  timerId: 0,
  setItem: function(item){
    this.abort();
    this.item = item;
    this.timerId = setTimeout(() => item.classList.add('item-selected'), 1000);
  },
  abort: function(){
    clearTimeout(this.timerId);
  }
}


function thumbImageItem(stat){
  let img = _newElement('img','img-thumb');
  img.alt = 'image';
  onVisible(img, () => {
    img.src = stat.mimetype.match('hei')
      ? android.requestAction("thumb", stat.path)
      : "file://" + stat.path;
  });
  if (stat.isHidden())
    img.classList.add('item-hidden');
  return img;
}

function thumbVideoItem(stat){
  let vid = _newElement('video','vid-thumb');
  vid.preload = 'metadata';
  onVisible(vid, () => vid.src = "file://" + stat.path + "#t=0.1");
  if (stat.isHidden())
    vid.classList.add('item-hidden');
  vid.controls = true;
  return vid;
}

function thumbAudioItem(r, stat){
  let mime = stat.mimetype.replaceAll("vorbis","ogg");
  let aud = "<audio class='aud-thumb' controls><source src='file://" + stat.path + "' type='" + mime + "'></audio>"
  r.innerHTML += aud;
}

function thumbFontItem(stat){
  let lorem = "AaBbCcDdEe 1234567890 #!@&";
  var c = "";
  for (let i = 12; i < 48; i += 6)
    c +='<div style="font-size: ' + i + 'px">'+lorem+'</div><div class="fntc-thumb">font size: '+i+'</div><br>'
  let t = '<style>@font-face{font-family: preview; src: url("file://'+stat.name+'");}.preview {font-family: preview;}</style><div class="preview">'+ c + '</div>';
  let d = _newElement('div','fnt-thumb');
  d.innerHTML = t;
  return d;
}

// see https://mozilla.github.io/pdf.js/examples/
function thumbPdfItem(stat){
  let img = _newElement('img','img-thumb');
  img.alt = 'image';
  var imgWidth = img.offsetWidth;
  var imgHeight = img.offsetHeight;
  onVisible(img, () => {
    pdfjsLib.getDocument({url: "file://" + stat.path, worker: pdfWorker}).promise.then(function (pdf) {
      pdf.getPage(1).then(function (page) {
        var canvas = document.createElement("canvas");
        var viewport = page.getViewport({scale: 1.0});
        var context = canvas.getContext('2d');

        if (imgWidth) {
            viewport = page.getViewport({scale: imgWidth / viewport.width});
        } else if (imgHeight) {
            viewport = page.getViewport({scale: imgHeight / viewport.height});
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({
            canvasContext: context,
            viewport: viewport
        }).promise.then(function () {
            img.src = canvas.toDataURL();
        });
      }).catch(function() {
          console.log("pdfThumbnails error: could not open page 1 of document " + filePath + ". Not a pdf ?");
      });
    }).catch(function() {
        console.log("pdfThumbnails error: could not find or open document " + filePath + ". Not a pdf ?");
    });
  });
  if (stat.isHidden())
    img.classList.add('item-hidden');
  return img;

}


function onVisible(element, callback) {
  new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.intersectionRatio > 0) {
        callback(element);
        observer.disconnect();
      }
    });
  }).observe(element);
  if(!callback) return new Promise(r => callback=r);
}



function addEmpty(){
  navContent.appendChild(_newElement('div','item-empty',"the folder is empty<br>no files found"));
}

/* MENUS */
function appendMenuItem(root, stat, action, title, subtitle){
  let menuItem = _newElement('div','list-item');
  menuItem.stat = stat;
  menuItem.action = action;
  let itemText = _newElement('div','item-text');
  itemText.appendChild(_newElement('div','item-title', title));
  itemText.appendChild(_newElement('div','item-subtitle', subtitle));
  menuItem.appendChild(itemText);
  menuItem.addEventListener('click', menuItemClickListener, false);
  root.appendChild(menuItem);
}

function menuItemClickListener(event){
  let target = event.currentTarget;
  if (target.action == 'fileop'){
    menuFileOp(target.stat);
  } else if (target.action == 'hexview'){
    window.location.assign("hexv.html?path="+target.stat.path);
    //let url = "https://diasgc.github.io/hexv/index.html?path=" + target.stat.path;
    //console.log("Opening hexview at " + url);
    //window.location.assign(url);
  } else if (android){
    android.requestAction(target.action, target.stat.path+","+target.stat.mimetype);
    dismissModalMenu();
  }
}

function dismissModalMenu(){
  popupMenu.style.display = 'none';
}

function modalMenu(e){
  let stat = e.currentTarget.stat;
  popupMenu.style.display = "block";
  popupContent.replaceChildren();
  popupContent.appendChild(_newElement('div','menuitem-header',stat.name));
  appendMenuItem(popupContent, stat, 'fileop', 'File Operations','Rename, Delete, Move, Copy');
  appendMenuItem(popupContent, stat, 'copypath', 'Path','Copy file path');
  appendMenuItem(popupContent, stat, 'open', 'Open','Open file as ' + stat.mimetype);
  appendMenuItem(popupContent, stat, 'openas', 'Open As','Open file as custom mimetype');
  appendMenuItem(popupContent, stat, 'hexview', 'HexView','View binary data');
  appendMenuItem(popupContent, stat, 'inspect', 'Inspect','View metadata, stat info, content and hex data');

  window.onclick = function(event) {
    if (event.target == popupMenu)
      dismissModalMenu();
  }
}

function menuFileOp(stat){
  popupContent.replaceChildren();
  popupContent.appendChild(_newElement('div','menuitem-header',stat.name));
  appendMenuItem(popupContent, stat, 'op_delete', 'Delete','Delete permanently');
  appendMenuItem(popupContent, stat, 'op_rename', 'Rename','Rename file');
  appendMenuItem(popupContent, stat, 'op_copy', 'Copy','Copy file to another location');
  appendMenuItem(popupContent, stat, 'op_move', 'Move','Copy file to another location');
  appendMenuItem(popupContent, stat, 'op_copypath', 'Path','Copy path');
}