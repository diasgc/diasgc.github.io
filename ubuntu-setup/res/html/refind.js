const osSizeInput = document.getElementById("os_size");

const selections = {
  dotColorId: document.getElementById("selection_dotcolor"),
  opacityId: document.getElementById("selection_opacity"),
  bigSize: 144,
  smallSize: 64,
  opacity: 0.05,
  color: "#111",
  dotColor: "#111",
  update: function(){
    selections.bigSize = data.main.os_iconsize + 16;
    selections.smallSize = data.main.os_iconsize + 16;
    selections.color = data.main.os_color;
  },
  init: function(){
    selections.dotColorId.addEventListener("input", function(){
      selections.dotColor = this.value;
    });
    selections.opacityId.addEventListener("input", function(){
      selections.opacity = this.value;
    });
  }
}

const pngFonts = {
  select: document.getElementById("png_fontfamily"),
  sizeId: document.getElementById("png_fontsize"),
  colorId: document.getElementById("png_fontcolor"),
  charWidth: 0.6,
  name: 'monospace',
  size: 14,
  xoff: 8.4,
  yoff: 24.8,
  wsize: 1847,
  color: '#111',
  family: 'monospace',
  style: 'bold',
  weight: 'bold',
  init: function(){
    pngFonts.select.innerHTML = "";
    for(const font of fonts.select.options){
      let opt = JSON.parse(font.value);
      if (opt.name.toLowerCase().includes("mono")){
        opt.monoWidth12 = pngFonts.getMonoCharWidth(12, opt.name);
        utils.addOption(pngFonts.select, JSON.stringify(opt), opt.name );
      }
    }
    pngFonts.select.addEventListener("change", function(){
      pngFonts.selectFont(this);
    });
    selections.init();
  },
  getMonoCharWidth: function(fontSize, fontFamily = 'monospace') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize} ${fontFamily}`;
    return ctx.measureText('M').width; // 'M' is a good wide char
  },
  selectFont: function(sel){
    const f = JSON.parse(sel.value);
    pngFonts.size = pngFonts.sizeId.value;
    pngFonts.charWidth = pngFonts.getMonoCharWidth(pngFonts.size, f.name);
    pngFonts.xoff = (pngFonts.charWidth).toFixed(1);
    pngFonts.yoff = (pngFonts.size * 0.775).toFixed(1);
    pngFonts.wsize = Math.ceil(pngFonts.charWidth * 96);
    pngFonts.color = pngFonts.colorId.value;
    pngFonts.name = f.name;
    pngFonts.family = f.family;
    pngFonts.style = f.style;
    pngFonts.weight = f.weight;
    renderSvg();
  }
}

function setOsSize(){
  document.documentElement.style.setProperty("--os-size", data.main.os_iconsize / opts.ui_resize + "px");
}

if (osSizeInput) {
  data.main.os_iconsize = osSizeInput.value;
  data.main.os_iconsize_w = osSizeInput.value;    
  osSizeInput.addEventListener("input", setOsSize);
  setOsSize();
}
opts.w_icon = 32;

const menu = {
  id: document.getElementById('os-panel'),
  iconData: {},
  import: async function(path){
    let svg = await fetchText(path);
    return svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,"fill=\"${preset.os_color}\"");
  },
  loadData: async function(){
    opts.iconList = [];
    document.getElementById('os-panel')
      .querySelectorAll('[id^="img_"]')
      .forEach(async img => {
        let name = img.id.replace("img_","");
        opts.iconList.push(name);
        menu.iconData[name] = await this.import(`icons/${opts.grubSet}/${name}.svg`);
      });
    document.getElementById('tools-panel')
      .querySelectorAll('[id^="img_"]')
      .forEach(async img => {
        let name = img.id.replace("img_","");
        opts.iconList.push(img.id.replace("img_",""))
        menu.iconData[name] = await this.import(`icons/refind/${name}.svg`);
      });
  }
}

function getMonoCharWidth(fontSize, fontFamily = 'monospace') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText('M').width; // 'M' is a good wide char
}

function renderSvg(){
  const img_preview = document.getElementById('img_preview');
  img_preview.src = encodeSvg(genSvg());
  updateIcons();
}

function updateIcons(){
  data.main.os_color = data.read('os_color');
  data.main.os_iconsize = osSizeInput.value * window.devicePixelRatio;
  data.main.os_toolsize = document.getElementById("tools_size").value * window.devicePixelRatio;
  data.main.os_iconsize_w = data.main.os_iconsize * opts.w_icon;
  opts.iconList.forEach(icon => {
    const svg = genSvgIcon(icon);
    document.getElementById(`img_${icon}`).src = encodeSvg(svg);
  });  
}

function genSvgIcon(name){
  const svg = menu.iconData[name];
  const preset = data.main; 
  return eval("`" + svg + "`");
}

function evalSvgIcon(svg){
  let font = data.main.font_family;
  let font_size = 12;
  let cap_title = svg.match('<title>(.*?)</title>')[1];
  let t = `<text x="50%" y="96%" font-size="18%" fill="${data.main.os_color}" alignment-baseline="middle" text-anchor="middle" font-family="Ubuntu" font-style="bold" font-weight="800">${cap_title}</text>`
  svg = svg.replaceAll("<!--text-here-->", t);
  
  //svg = svg.replaceAll("viewBox=\"0 0 32 32\"",`viewBox=\"0 0 ${opts.w_icon} 32\"`);
  const preset = data.main;
  return eval("`" + svg + "`");
}

async function getBlobFromSvg(path, width, height) {
  let svg = await fetchText(path);
  svg = eval("`" + svg + "`");
  return await svg2image(svg, 'png', width, height);
}

const os_trans = {
  "windows": "win",
}

async function exportMedia() {
  const status = document.getElementById('progress_status');
  const zip = new JSZip();
  // add config grub
  status.innerText = "Generating theme.conf...";
  zip.file(`${opts.id}/theme.conf`, fetchEval("html/config-refind.txt"));
  status.innerText = "Adding background";
  // add background
  zip.file(`${opts.id}/background.png`, getWpBlob('png', opts.resX, opts.resY), { base64: true });
  // add os-icons
  for (os of opts.osList) {
    status.innerText = `Adding icon ${os}`;
    let svg = await fetchText(`icons/${opts.grubSet}/${os}.svg`);
    svg = svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,`fill="${data.main.os_color}"`);
    svg = evalSvgIcon(svg);
    const blob = await svg2image(svg, 'png', data.main.os_iconsize, data.main.os_iconsize);
    if (os_trans[os]) os = os_trans[os];
    zip.file(`${opts.id}/icons/os_${os}.png`, blob.split(',')[1], { base64: true });
  }
  for (re of opts.refindList) {
    status.innerText = `Adding icon ${re}`;
    let svg = await fetchText(`icons/refind/${re}.svg`);
    svg = svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,`fill="${data.main.os_color}"`);
    svg = eval("`" + svg + "`");
    //svg = svg.replaceAll("viewBox=\"0 0 32 32\"",`viewBox=\"0 0 ${data.main.os_toolsize} ${data.main.os_toolsize}\"`);
    const blob = await svg2image(svg, 'png', data.main.os_toolsize, data.main.os_toolsize);
    zip.file(`${opts.id}/icons/${re}.png`, blob.split(',')[1], { base64: true });
  }

  status.innerText = `Adding selection and font`;
  selections.bigSize = data.main.os_iconsize + 16;
  selections.smallSize = data.main.os_iconsize + 16;
  selections.opacity = 0.05;
  selections.color = data.main.os_color;
  selections.dotColor = data.main.os_color;

  let svg = await fetchText(`refind/selection_big.svg`);
  svg = eval("`" + svg + "`");
  let blob = await svg2image(svg, 'png', selections.bigSize, selections.bigSize);
  zip.file(`${opts.id}/selection_big.png`, blob.split(',')[1], { base64: true });
  
  svg = await fetchText(`refind/selection_small.svg`);
  svg = eval("`" + svg + "`");
  blob = await svg2image(svg, 'png', selections.smallSize, selections.smallSize);
  zip.file(`${opts.id}/selection_small.png`, blob.split(',')[1], { base64: true });

  status.innerText = `Adding font`;
  svg = await fetchText(`refind/refind-pngfont.svg`);
  svg = eval("`" + svg + "`");
  blob = await svg2image(svg, 'png', pngFonts.wsize, pngFonts.size);
  zip.file(`${opts.id}/refind-pngfont.png`, blob.split(',')[1], { base64: true });
  
  // generate zip
  status.innerText = "Generating zip...";

  zip.file("note.txt","Add 'include themes/surface/theme-w.conf' to the end of refind.conf\n")
  const content = await zip.generateAsync({ type: "blob" });
  // download
  status.innerText = "Done";
  utils.downloadBlob(content, `refind-theme-${opts.id}-${opts.vendor}.zip`);
}

function initComponents() {

  checkTripleStateCheckbox();
  
  menu.loadData();
  
  const confTimeout = document.getElementById('conf_timeout');
  if (confTimeout){
    confTimeout.addEventListener('change', function() {
      document.getElementById('div-shutdown').style.display = this.value > 0 ? 'inline-block' : 'none';
      document.getElementById('div-screensaver').style.display = this.value > 0 ? 'inline-block' : 'none';
    });
  }
  // tools_size sync
  const toolsSizeInput = document.getElementById("tools_size");
  if (toolsSizeInput) {
    document.documentElement.style.setProperty("--tools-size",toolsSizeInput.value * opts.ratio + "%");
    toolsSizeInput.addEventListener("input", function () {
      document.documentElement.style.setProperty("--tools-size",this.value * opts.ratio + "%");
    });
  }
  // os_size sync
  const osSizeInput = document.getElementById("os_size");
  if (osSizeInput) {
    document.documentElement.style.setProperty("--os-size", osSizeInput.value * opts.ratio + "%");
    osSizeInput.addEventListener("input", function () {
      document.documentElement.style.setProperty("--os-size", this.value * opts.ratio + "%" );
    });
  }

  let dragged = null;
  const toolsPanel = document.getElementById("tools-panel");
  if (toolsPanel) {
    toolsPanel.querySelectorAll(".tools-square").forEach((square) => {
      const img = square.querySelector("img");
      square.addEventListener("dblclick", function () {
        this.classList.toggle("disabled-tool");
        updateDisabledToolsVisibility();
      });
      square.addEventListener("dragstart", function (e) {
        dragged = this;
        e.dataTransfer.effectAllowed = "move";
        // Optional: visual feedback
        setTimeout(() => this.classList.add("dragging"), 0);
      });
      square.addEventListener("dragend", function () {
        dragged = null;
        this.classList.remove("dragging");
      });
      square.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });
      square.addEventListener("drop", function (e) {
        e.preventDefault();
        if (dragged && dragged !== this) {
          // Insert before or after depending on mouse position
          const rect = this.getBoundingClientRect();
          const offset = e.clientX - rect.left;
          if (offset < rect.width / 2) {
            toolsPanel.insertBefore(dragged, this);
          } else {
            toolsPanel.insertBefore(dragged, this.nextSibling);
          }
        }
      });
    });
  }

  // Hide/show disabled tools logic
  const toggle = document.getElementById("toggle-disabled-tools");
  function updateDisabledToolsVisibility() {
    if (toggle.checked) {
      toolsPanel.classList.remove("hide-disabled");
    } else {
      toolsPanel.classList.add("hide-disabled");
    }
  }
  if (toggle) {
    toggle.addEventListener("change", updateDisabledToolsVisibility);
    // Initial state
    updateDisabledToolsVisibility();
  }
}
