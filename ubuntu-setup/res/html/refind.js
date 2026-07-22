const osSizeInput = document.getElementById("os_size");

const tools = {
  sizeId: document.getElementById("tools-size"),
  colorId: document.getElementById("tools-size"),
  panelId: document.getElementById("tools-panel"),
  size: 48,
  color: "#111",
  update: function(){
    tools.size = tools.sizeId.value;
    tools.color = tools.colorId.value;
    data.main.os_toolsize = tools.size * window.devicePixelRatio;
  },
  init: function(){
    tools.panelId
      .querySelectorAll('[id^="img_"]')
      .forEach(async img => {
        let name = img.id.replace("img_","");
        opts.iconList.push(img.id.replace("img_",""))
        menu.iconData[name] = await menu.import(`icons/refind/${name}.svg`);
      });
    tools.sizeId.addEventListener("input", tools.update);
    tools.colorId.addEventListener("input", tools.update);
  }
}

const selections = {
  dotColorId: document.getElementById("selection_dotcolor"),
  opacityId: document.getElementById("selection_opacity"),
  ids: ["selection_big", "selection_small"],
  bigSize: 144,
  smallSize: 64,
  opacity: 0.05,
  color: "#111",
  dotColor: "#111",
  update: function(){
    selections.bigSize = data.main.os_iconsize + 16;
    selections.smallSize = data.main.os_iconsize + 16;
    selections.color = data.main.os_color;
    selections.dotColor = this.dotColorId.value;
    selections.opacity = this.opacityId.value;
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
  padding: 0,
  backgroundColor: null,
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
    tools.init();
  },
  getFilename: function(){
    let fname = `${pngFonts.name}-${pngFonts.weight}-${pngFonts.size}`;
    fname = fname.replaceAll(" ","-").replaceAll('"','').replaceAll("'","");
    return fname;
  },
  renderPng: function(){
    const text = ' !\"#\$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~?';
    
    //const cssFont = `${pngFonts.style} ${pngFonts.weight} ${pngFonts.size}px "${pngFonts.name}"`;
    const cssFont = `${pngFonts.weight} ${pngFonts.size}px "${pngFonts.family}"`;
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = cssFont;
    const metrics = measureCtx.measureText(text);

    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;

    if (!ascent && ascent !== 0) {
      throw new Error('actualBoundingBoxAscent/Descent unsupported in this environment.');
    }

    const textWidth = metrics.width;
    const textHeight = ascent + descent;
    const canvasWidth = Math.ceil(textWidth + pngFonts.padding * 2);
    const canvasHeight = pngFonts.size; //Math.ceil(textHeight + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (pngFonts.backgroundColor) {
      ctx.fillStyle = pngFonts.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.font = cssFont;
    ctx.fillStyle = pngFonts.color;
    ctx.textBaseline = 'alphabetic';

    const baselineY = pngFonts.padding + ascent;
    ctx.fillText(text, pngFonts.padding, baselineY);
    return canvas.toDataURL("image/png", 1.0);
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
  }
}

function setOsSize(){
  document.documentElement.style.setProperty("--os-size", data.main.os_iconsize / opts.ui_resize + "px");
  //document.documentElement.style.setProperty("--os-size", data.main.os_iconsize / opts.ui_resize + "px");
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
    tools.init();
  }
}

function renderSvg(){
  const img_preview = document.getElementById('img_preview');
  img_preview.src = encodeSvg(genSvg());
  updateIcons();
}

function updateIcons(){
  data.main.os_color = data.read('os_color');
  data.main.os_iconsize = osSizeInput.value * window.devicePixelRatio;
  data.main.os_iconsize_w = data.main.os_iconsize;
  tools.update();
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

const os_trans = {
  "windows": "win",
}

/*
async function renderCharsetBlob(fontName, fontSize, color = '#111111', fontWeight = 'normal',
  fontStyle = 'normal', bgColor = null, padding = 0) {
 
  const text = ' !\"#\$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~?';
  // Ensure font is actually loaded (avoids silent fallback-font metrics)
  const cssFont = `${fontStyle} ${fontWeight} ${fontSize}px "${fontName}"`;
 
  // Measure first with a throwaway canvas
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = cssFont;
  const metrics = measureCtx.measureText(text);

  const textWidth = metrics.width;
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;

  if (!ascent && ascent !== 0) {
    throw new Error('actualBoundingBoxAscent/Descent unsupported in this environment.');
  }

  const textHeight = ascent + descent;
  const canvasWidth = Math.ceil(textWidth + padding * 2);
  const canvasHeight = fontSize; //Math.ceil(textHeight + padding * 2);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.font = cssFont;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';

  const baselineY = padding + ascent;
  ctx.fillText(text, padding, baselineY);
  return canvas.toDataURL("image/png", 1.0);
}
*/

function replaceFill(svg, color) {
  return svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi, `fill="${color}"`);
}

async function exportMedia() {
  const status = document.getElementById('progress_status');
  const zip = new JSZip();
  
  let toolList = [];
  tools.panelId.querySelectorAll('div:not(.disabled-tool)').forEach(div => {
    let img = div.querySelector('img');
    if (img) {
      toolList.push(img.id.replaceAll("img_func_","").replaceAll("img_tool_",""));
    }
  });
  opts.showtools = toolList.size > 0 ? "showtools " + toolList.join(",") : "";

  // add config grub
  status.innerText = "Generating theme.conf...";
  zip.file(`${opts.id}/theme.conf`, fetchEval("html/config-refind.txt"));
  
  // add background
  status.innerText = "Adding background";
  zip.file(`${opts.id}/background.png`, getWpBlob('png', opts.resX, opts.resY), { base64: true });
  
  // add os-icons
  for (os of opts.osList) {
    status.innerText = `Adding OS Icon ${os}`;
    let svg = await fetchEval(`icons/${opts.grubSet}/${os}.svg`, t => evalSvgIcon(replaceFill(t, data.main.os_color)));
    const blob = await svg2image(svg, 'png', data.main.os_iconsize, data.main.os_iconsize);
    if (os_trans[os]) os = os_trans[os];
    zip.file(`${opts.id}/icons/os_${os}.png`, blob.split(',')[1], { base64: true });
  }

  // add tool-icons
  for (re of opts.refindList) {
    status.innerText = `Adding Tool Icon ${re}`;
    let svg = await fetchEval(`icons/refind/${re}.svg`, t => replaceFill(t, data.main.os_color));
    const blob = await svg2image(svg, 'png', data.main.os_toolsize, data.main.os_toolsize);
    zip.file(`${opts.id}/icons/${re}.png`, blob.split(',')[1], { base64: true });
  }

  status.innerText = `Adding selection`;
  selections.update();

  let svg = await fetchEval(`refind/selection_big.svg`);
  let blob = await svg2image(svg, 'png', selections.bigSize, selections.bigSize);
  zip.file(`${opts.id}/selection_big.png`, blob.split(',')[1], { base64: true });
  
  svg = await fetchEval(`refind/selection_small.svg`);
  blob = await svg2image(svg, 'png', selections.smallSize, selections.smallSize);
  zip.file(`${opts.id}/selection_small.png`, blob.split(',')[1], { base64: true });

  status.innerText = `Adding font`;
  //let fname = `${pngFonts.name}-${pngFonts.weight}-${pngFonts.size}`;
  //fname = fname.replaceAll(" ","-").replaceAll('"','').replaceAll("'","");
  //blob = await renderCharsetBlob(pngFonts.name, pngFonts.size, pngFonts.color, pngFonts.weight);
  const fname = pngFonts.getFilename();
  blob = pngFonts.renderPng();
  zip.file(`${opts.id}/${fname}.png`, blob.split(',')[1], { base64: true });
  
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
  // tools-size sync
  const toolsSizeInput = document.getElementById("tools-size");
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
  //const toolsPanel = document.getElementById("tools-panel");
  if (tools.panelId) {
    tools.panelId.querySelectorAll(".tools-square").forEach((square) => {
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
            tools.panelId.insertBefore(dragged, this);
          } else {
            tools.panelId.insertBefore(dragged, this.nextSibling);
          }
        }
      });
    });
  }

  // Hide/show disabled tools logic
  const toggle = document.getElementById("toggle-disabled-tools");
  function updateDisabledToolsVisibility() {
    if (toggle.checked) {
      tools.panelId.classList.remove("hide-disabled");
    } else {
      tools.panelId.classList.add("hide-disabled");
    }
  }
  if (toggle) {
    toggle.addEventListener("change", updateDisabledToolsVisibility);
    // Initial state
    updateDisabledToolsVisibility();
  }
}
