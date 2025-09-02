const urlParams = new URLSearchParams(window.location.search);

async function loadContent(tag) {
  let html = await fetchText(`html/ctrl-${tag}.html`);
  document.getElementById('control-extra').innerHTML = html;
  if (tag !== 'wallpaper'){
    html = await fetchText(`html/prev-${tag}.html`);
    document.getElementById('preview-extra').innerHTML = html;
  }
  // load script
  const script = document.createElement('script');
  script.src = `html/${tag}.js`;
  script.type = 'text/javascript';
  script.onload = init; // Executes when the script is loaded
  document.head.appendChild(script);
}

function encodeSvg(svg){
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function spanText(id, y, fontSize, lineHeight) {
  const e = document.getElementById(id);
  return e ? e.value.split('\n')
    .map((a,i) => '<tspan x="50%" y="'+ (y + (fontSize * lineHeight) * (1 + i)) + '">' + a + '</tspan>')
    .join('\n') : '';
}

function genSvg(){
  wallpaper.refresh();
  const preset = data.main;
  const y_title = preset.title_y / 100 * opts.wp_h;
  const y_footer = preset.footer_y / 100 * opts.wp_h;
  const title = spanText('title', y_title, preset.font_size_title, 1.2);
  const footer = spanText('footer', y_footer, preset.font_size_footer, 1.2);
  const font_stretch = `font-stretch='${preset.font_family.stretch}'`
  const logo_y =  (1 + parseInt(preset.logo_dy)/50) * opts.wp_h/2 - wallpaper.logoH / 2 * preset.logo_scale;
  const logo_x =  (1 + parseInt(preset.logo_dx)/50) * 2256/2 - wallpaper.logoW / 2 * preset.logo_scale;
  return eval("`" + wallpaper.svg + "`");
}

async function getIconBlob(name, format, width, height){
  const svg = genSvgIcon(name);
  const blob = format === 'svg' ? svg : await svg2image(svg, format, width, height);
  return blob.split(',')[1];
}

async function fetchBlob(url){
  const res = await fetch(url);
  const blob = await res.blob();
  const buff = await blob.arrayBuffer();
  return buff;
}

async function fetchText(url){
  const res = await fetch(url);
  const text = await res.text();
  return text;
}

async function fetchEval(url){
  const text = await fetchText(url);
  const ret = eval("`" + text + "`"); 
  return ret;
}

async function getWpBlob(format, width, height){
  const blob = format === 'svg' ? genSvg() : await svg2image(genSvg(), format, width, height);
  return blob.split(',')[1];
}

async function svg2image(svg, format='png', width = opts.resX, height = opts.resY, isSvgEncoded=false) {
  const img = new Image();
  img.src = isSvgEncoded ? svg : encodeSvg(svg);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [width, height];
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/" + format, 1.0);
}

async function loadBlob(url){
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract Base64 part
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function exportResult(){
  exportMedia();
}

function render(){
  renderSvg();
}

function init(){
  // Add event listener for the render button
  button_export.addEventListener('click', exportResult);
  // Add event listeners to all inputs
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', render);
  });
  document.getElementById('title').textContent = opts.defTitle;
  document.getElementById('footer').textContent = opts.defFooter;
  document.getElementById('title').addEventListener('input', render);
  document.getElementById('footer').addEventListener('input', render);
  // external function
  wallpaper.load().then(() => {
    render();
  });
  initComponents();
}

function xmlElement(name, value){
  const xml = document.createElement(name);
  xml.textContent = value;
  return xml;
}

// triple-state checkbox
function checkTripleStateCheckbox(){
  document.querySelectorAll("input[type=checkbox][id^=conf_]")
    .forEach(el => {
      el.state = 0;
      el.indeterminate = true;
      el.checked = true;
      el.onclick = () => {
        el.state = ++el.state % 3   // cycle through 0,1,2
        if (el.state == 0) {
            el.indeterminate = true;
            el.checked = true;   // after 'indeterminate' the state 'false' follows 
        }    
      }
    }
  );
}


const utils = {
  addOption: function(parent, val, txt){
    parent.appendChild(this.createOption(val, txt));
  },
  createOption: function(val, txt){
    const o = document.createElement('option');
    o.value = val;
    o.textContent = txt;
    return o;
  },
  downloadBlob: function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const intro = {
  panel: document.getElementById('intro'),
  input: document.getElementById('intro-ctrl'),
  msgId: document.getElementById('intro-text'),
  ok: document.getElementById('intro-ok'),
  msg: "This page needs to access all installed fonts. Click «ok» to proceed. After exporting the zip file, run «install.sh»", 
  init: function(callback){
    this.panel.style.display = 'block';
    if (opts.vendor){
      this.input.style.display = 'none';
    } else {
      this.input.style.display = 'block';
      this.loadIntroOpts();
    }
    this.msgId.textContent = this.msg;
    this.ok.addEventListener('click', fonts.init);
  },
  loadIntroOpts: function(){
    const v = document.getElementById('ctrl-vendor');
    const ar = document.getElementById('ctrl-ar');
    opts.vndList.forEach(vnd => utils.addOption(v, vnd, vnd));
    v.addEventListener('change', () => {
      opts.vendor = v.value;
      wallpaper.load();
      renderSvg();
    });
    ar.addEventListener('change', () => {
      let a = ar.value === 'auto' 
        ? [ window.screen.width, window.screen.height ]
        : ar.value.split(':');
      opts.ar = a[1]/a[2];
      opts.resX = 2256;
      opts.resY = 2256 / ar.value;
      opts.wp_h = opts.resY;
    })
  }
}

const data = {
  main: {
    pattern_color: '#000000',
    pattern_alpha: '0.05',
    grad_top: '#333333',
    grad_bot: '#03080c',
    grad_alpha: '1.0',
    logo_color: '#ffffff',
    logo_alpha: '0.1',
    logo_scale: '1.0',
    logo_dx: '0',
    logo_dy: '0',
    font_color: '#ffffff',
    font_family: {},
    font_size_title: '40',
    font_size_footer: '14',
    font_alpha: '1.0',
    title_y: 13,
    footer_y: 92,
    current: 'dark'
  },
  presets: {
    dark: {
      pattern_color: '#ffffff',
      pattern_alpha: '0.05',
      grad_top: '#333333',
      grad_bot: '#03080c',
      grad_alpha: '1.0',
      logo_color: '#000000',
      logo_alpha: '0.1',
      logo_dx: '0',
      logo_dy: '0',
      font_color: '#ffffff',
      current: 'dark'
    },
    light: {
      pattern_color: '#000000',
      pattern_alpha: '0.05',
      grad_top: '#D8D8D8',
      grad_bot: '#C0C6CC',
      grad_alpha: '1.0',
      logo_color: '#ffffff',
      logo_alpha: '0.1',
      logo_dx: '0',
      logo_dy: '0',
      font_color: '#000000',
      current: 'light'
    },
  },
  read: function(id){ //updatePreset(key)
    const val = document.getElementById(id).value;
    this.presets[this.main.current][id] = val;
    this.main[id] = val;
    return val;
  },
  keys: [],
}

const wallpaper = {
  id: document.getElementById('img_preview'),
  imgFormat: 'png',
  tmp: '',
  svg: '',
  logoCache: {},
  keys: [],
  load: async function() {
    data.main.font_family = fonts.defaultFont;
    this.keys = Object.keys(data.main);
    this.tmp = await fetchText('html/wp-base.svg');
    this.loadVendorList();
    this.svg = this.tmp;
    if (opts.vendor){
      this.setLogo();
    }
  },
  loadVendorList: function(){
    const vendor = document.getElementById('vendor');
    opts.vndList.sort();
    const defVnd = urlParams.get('vnd');
    if (defVnd)
      utils.addOption(vendor, defVnd, 'auto');
    opts.vndList.forEach(vnd => utils.addOption(vendor, vnd, vnd));
    if (opts.vendor !== '')
      vendor.value = opts.vendor;
    vendor.addEventListener('change', () => {
      opts.vendor = vendor.value; 
      this.setLogo()
    });
  },
  setLogo: async function(){
    var logo;
    if (this.logoCache[opts.vendor]){
      logo = this.logoCache[opts.vendor];
    } else {
      logo = await fetchText(`icons/hw/${opts.vendor}.svg`);
      [ , this.logoW, this.logoH ] = logo.match('viewBox="0 0 (.*?) (.*?)"');
      logo = logo.replace(/^<svg.*>/gi,'')
      .replace(/<\/svg>/gi,'')
      .replaceAll(/fill="#[0-9a-fA-F]+"/gi,"fill='${preset.logo_color}'")
      .trim();
      this.logoCache[opts.vendor] = logo;
    }
    this.svg = this.tmp.replace('<!--logo-data-->', logo);
    renderSvg();
  },
  forEachKey: function(callback){
    this.keys = [];
    Object.keys(data.main).forEach(key => {
      let id = document.getElementById(key);
      if (id){
        this.keys.push(key);
        callback(key, id);
      }
    });
  },
  loadPreset: function(name){
    if (data.presets[name]){
      data.main = { ...data.main, ...data.presets[name] };
      // load ui values to preset
      this.forEachKey((key, id) => {
        id.value = data.main[key];
      });
      renderSvg();
    }
  },
  refresh: function(){
    const curr = data.main.current;
    this.forEachKey((key, ui) => {
      let val = ui.value;
      if (key === 'font_family')
        val = val ? JSON.parse(val) : data.main.font_family;
      data.main[key] = val;
      if (data.presets[curr][key])
        data.presets[curr][key] = val;
    })
  }
}

const fonts = {
  select: document.getElementById('font_family'), 
  weights: {
    "thin": 100,
    "extralight": 200,
    "ultralight": 200,
    "light": 300,
    "normal": 400,
    "medium": 500,
    "semibold": 600,
    "demibold": 600,
    "bold": 700,
    "extrabold": 800,
    "ultrabold": 800,
    "black": 900,
    "heavy": 900
  },
  sysFont:{
    family: 'sans',
    style: 'normal',
    name: 'default',
    weight: 400,
    stretch: 'normal'
  },
  defaultFont: {
    family: 'Ubuntu',
    style: 'normal',
    weight: 400,
    name: 'Ubuntu Regular',
    stretch: 'normal'
  },
  guess: function(font){
    const n = font.style.toLowerCase().replaceAll(' ','');
    let w = 400;
    Object.keys(this.weights).every(fw => {
      if (n.includes(fw)){
        w = this.weights[fw];
        return false
      }
      return true;
    });
    return {
      family: font.family,
      style: n.includes('italic') || n.includes('oblique') ? 'italic' : 'normal',
      name: font.fullName,
      weight: w,
      stretch: n.includes('condensed') ? 'condensed' : 'normal'
    };
  },
  setDefault: function(err=''){
    intro.panel.style.background = '#f008';
    preset.font_family = this.sysFont;
    intro.panel.textContent = err;
    utils.addOption(fonts.select,JSON.stringify(this.defaultFont),"default");
    setTimeout(() => document.getElementById('intro').style.display = 'none',2000);
  },
  init: function(){
    fonts.select.innerHTML = '';
    if ('queryLocalFonts' in window) {
      window.queryLocalFonts()
        .then((fnts) => {
          fnts.sort((a,b) => a.fullName.localeCompare(b.fullName));
          fnts.forEach((font) => {
            const f = fonts.guess(font);
            utils.addOption(fonts.select, JSON.stringify(f), f.name );
          });
          fonts.select.value = JSON.stringify(fonts.defaultFont);
          fonts.select.addEventListener('change', renderSvg);
          document.getElementById('intro').style.display = 'none';
      }).catch((err) => {
        fonts.setDefault("Error accessing local fonts:" + err)
      });
    } else {
      fonts.setDefault("Local Font Access API is not supported in this browser.")
    }
  }
}

/*  main  */

opts.vendor = urlParams.get('vnd') || opts.vendor.replace('@vendor','');
opts.resX = urlParams.get('w') || opts.resX.replace('@resX',window.screen.width * window.devicePixelRatio);
opts.resY = urlParams.get('h') || opts.resY.replace('@resY',window.screen.height * window.devicePixelRatio);
opts.ar = opts.resX / opts.resY;
opts.wp_h = 2256 / opts.ar;
opts.user = urlParams.get('usr') || opts.user;
opts.home = `/home/${opts.user}`;
opts.grubSet = opts.grubSet.replace("@grub_set",'') || "grub-os-symb";
opts.ratio = 100 / window.screen.height / window.devicePixelRatio;

intro.init(fonts.init);

const button_export = document.getElementById('button_export');

if (opts.defTitle.startsWith("@")){
  switch(opts.type){
    case 'grub':
      opts.defTitle="Choose an operating system to start";
      opts.defFooter="Use the up and down keys to select your choice. Press Enter to boot the selected OS, &#39;e&#39;; to edit the commands before booting or &#39;c&#39; for a command-line"
      break;
    case 'refind':
      opts.defTitle = "rEFInd boot menu";
      opts.defFooter = `powered by ${opts.user}`;
      break;
    default:
      opts.defTitle = "";
      opts.defFooter = `powered by ${opts.user}`;
      break;
  }
}
  
opts.id = opts.id.replace('@id', Date.now().valueOf().toString(16));
opts.type = urlParams.get('t') || opts.type.replace('@type','wallpaper');

loadContent(opts.type);