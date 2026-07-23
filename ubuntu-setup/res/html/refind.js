opts.w_icon = 32;
const osSizeInput = document.getElementById("os_size");

const panel_tools = {
  sizeId:   document.getElementById("tools-size"),
  colorId:  document.getElementById("tools-size"),
  panelId:  document.getElementById("tools-panel"),
  toggleId: document.getElementById("toggle-disabled-tools"),
  size: 48,
  color: "#111",
  dragged: null,
  
  init: function(){
    panel_tools.panelId
      .querySelectorAll('[id^="img_"]')
      .forEach(async img => {
        let name = img.id.replace("img_","");
        opts.iconList.push(img.id.replace("img_",""))
        menu.iconData[name] = await menu.import(`icons/refind/${name}.svg`);
      });
    panel_tools.sizeId.addEventListener("input", panel_tools.update);
    panel_tools.colorId.addEventListener("input", panel_tools.update);
    panel_tools.update();
    panel_tools.setDraggable();
  },
  update: function(){
    panel_tools.size = panel_tools.sizeId.value;
    panel_tools.color = panel_tools.colorId.value;
    data.main.os_toolsize = panel_tools.size * opts.ar;
    document.documentElement.style.setProperty("--tools-size", panel_tools.sizeId.value * opts.ratio + "%");
  },

  updateDisabledToolsVisibility: function(){
    if (panel_tools.toggleId.checked) {
      panel_tools.panelId.classList.remove("hide-disabled");
    } else {
      panel_tools.panelId.classList.add("hide-disabled");
    }
  },

  setDraggable: function(){
    panel_tools.panelId
      .querySelectorAll(".tools-square")
      .forEach((square) => {
        const img = square.querySelector("img");
        // double-click
        square.addEventListener("dblclick", function (e) {
          this.classList.toggle("disabled-tool");
          panel_tools.updateDisabledToolsVisibility();
        });
        // drag: start
        square.addEventListener("dragstart", function (e) {
          panel_tools.dragged = this;
          e.dataTransfer.effectAllowed = "move";
          // Optional: visual feedback
          setTimeout(() => this.classList.add("dragging"), 0);
        });
        // drag: end
        square.addEventListener("dragend", function () {
          panel_tools.dragged = null;
          this.classList.remove("dragging");
        });
        // drag: over
        square.addEventListener("dragover", function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });
        // drag: drop
        square.addEventListener("drop", function (e) {
          e.preventDefault();
          if (panel_tools.dragged && panel_tools.dragged !== this) {
            // Insert before or after depending on mouse position
            const rect = this.getBoundingClientRect();
            const offset = e.clientX - rect.left;
            panel_tools.panelId.insertBefore(panel_tools.dragged, offset < rect.width / 2 ? this : this.nextSibling);
            //if (offset < rect.width / 2) {
            //  panel_tools.panelId.insertBefore(panel_tools.dragged, this);
            //} else {
            //  panel_tools.panelId.insertBefore(panel_tools.dragged, this.nextSibling);
            //}
          }
        });
    });
    
   // Hide/show disabled tools logic
    if (panel_tools.toggleId) {
      panel_tools.toggleId.addEventListener("change", panel_tools.updateDisabledToolsVisibility);
      // Initial state
      panel_tools.updateDisabledToolsVisibility();
    }
  }
}

const selectors = {
  dotColorId: document.getElementById("selection_dotcolor"),
  opacityId: document.getElementById("selection_opacity"),
  ids: ["big", "small"],
  bigSize: 144,
  smallSize: 64,
  opacity: 0.05,
  color: "#111",
  dotColor: "#800",
  iconData: {
    "big": {
      data: null,
      size: 144
    },
    "small": {
      data: null,
      size: 64
    },
    loadData: async function(tag){
      let t = await fetchText(`refind/selection_${tag}.svg`);
      t = t.replaceAll(/fill=".*" fill-opacity=".*"/gi,
        "fill=\"${selectors.color}\" fill-opacity=\"${selectors.opacity}\"")
        .replaceAll(/fill="(?!\${).*"\/>/gi, "fill=\"${selectors.dotColor}\"/>")
      selectors.iconData[tag].data = t;
    },
    getBlob: async function(tag){
      let svg = eval("`" + selectors.iconData[tag].data + "`");
      return await svg2image(svg, 'png', selectors.iconData[tag].size, selectors.iconData[tag].size);
    }
  },
  update: function(){
    selectors.iconData.big.size = data.main.os_iconsize + 16;
    selectors.bigSize = data.main.os_iconsize + 16;
    selectors.iconData.small.size = data.main.os_toolsize + 16;
    selectors.smallSize = data.main.os_toolsize + 16;
    selectors.color = data.main.os_color;
    selectors.dotColor = this.dotColorId.value;
    selectors.opacity = this.opacityId.value;
  },
  init: function(){
    selectors.iconData.loadData("big");
    selectors.iconData.loadData("small");
    selectors.dotColorId.addEventListener("input", function(){
      selectors.dotColor = this.value;
    });
    selectors.opacityId.addEventListener("input", function(){
      selectors.opacity = this.value;
    });
  }
}

const panel_os = {
  id: document.getElementById('os-panel'),
  iconData: {},
  sizeId: document.getElementById("os_size"),
  init: function(){
    this.sizeId.addEventListener("input", panel_os.update);
    panel_os.update();
  },
  update: function(){
    data.main.os_color = data.read('os_color');
    data.main.os_iconsize = this.sizeId.value * opts.ar;
    data.main.os_iconsize_w = data.main.os_iconsize;
    document.documentElement.style.setProperty("--os-size", data.main.os_iconsize / opts.ui_resize + "px");
  }
}

const font_png = {
  select: document.getElementById("png_fontfamily"),
  sizeId: document.getElementById("png_fontsize"),
  colorId: document.getElementById("png_fontcolor"),
  font: {
    name: 'monospace',
    color: '#111',
    family: 'monospace',
    style: 'normal',
    weight: 'bold',  
  },
  padding: 0,
  charset: ' !\"#\$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~?',
  backgroundColor: null,
  init: function(){
    font_png.select.innerHTML = "";
    for(const font of fonts.select.options){
      let opt = JSON.parse(font.value);
      if (opt.name.toLowerCase().includes("mono")){
        utils.addOption(font_png.select, JSON.stringify(opt), opt.name );
      }
    }
    font_png.select.addEventListener("change", function(){
      font_png.selectFont(this);
    });
    font_png.sizeId.addEventListener("change", font_png.update);
    font_png.colorId.addEventListener("change", font_png.update);
    font_png.update();
    selectors.init();
  },
  getFilename: function(){
    let fname = `${font_png.font.name}-${font_png.font.weight}-${font_png.size}`;
    fname = fname.replaceAll(" ","-").replaceAll('"','').replaceAll("'","");
    return fname;
  },
  render: function(){
    const cssFont = `${font_png.font.weight} ${font_png.size}px "${font_png.font.family}"`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = cssFont;
    const metrics = ctx.measureText(font_png.charset);
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    const textHeight = ascent + descent;
    canvas.width = Math.ceil(metrics.width + font_png.padding * 2);
    canvas.height = font_png.size; //Math.ceil(textHeight + padding * 2);
    
    if (font_png.backgroundColor) {
      ctx.fillStyle = font_png.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.fillStyle = font_png.color;
    ctx.textBaseline = 'alphabetic';

    ctx.fillText(font_png.charset, font_png.padding, font_png.padding + ascent);
    return canvas.toDataURL("image/png", 1.0);
  },
  renderPng: function(){
    const text = ' !\"#\$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~?';
    
    //const cssFont = `${pngFonts.style} ${pngFonts.weight} ${pngFonts.size}px "${pngFonts.name}"`;
    const cssFont = `${font_png.weight} ${font_png.size}px "${font_png.family}"`;
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
    const canvasWidth = Math.ceil(textWidth + font_png.padding * 2);
    const canvasHeight = font_png.size; //Math.ceil(textHeight + padding * 2);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (font_png.backgroundColor) {
      ctx.fillStyle = font_png.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.font = cssFont;
    ctx.fillStyle = font_png.color;
    ctx.textBaseline = 'alphabetic';

    const baselineY = font_png.padding + ascent;
    ctx.fillText(text, font_png.padding, baselineY);
    return canvas.toDataURL("image/png", 1.0);
  },
  update: function(){
    font_png.size = font_png.sizeId.value;
    font_png.color = font_png.colorId.value;
  },
  selectFont: function(sel){
    font_png.font = JSON.parse(sel.value);
    /*
    const f = JSON.parse(sel.value);
    font_png.name = f.name;
    font_png.family = f.family;
    font_png.style = f.style;
    font_png.weight = f.weight;
    */
  }
}

/*
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
*/

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
    panel_os.init();
    panel_tools.init();
  }
}

function renderSvg(){
  const img_preview = document.getElementById('img_preview');
  img_preview.src = encodeSvg(genSvg());
  updateIcons();
}

function updateIcons(){
  panel_os.update();
  panel_tools.update();
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

function replaceFill(svg, color) {
  return svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi, `fill="${color}"`);
}

async function exportMedia() {
  const status = document.getElementById('progress_status');
  const zip = new JSZip();
  
  let toolList = [];
  panel_tools.panelId.querySelectorAll('div:not(.disabled-tool)').forEach(div => {
    let img = div.querySelector('img');
    if (img) {
      toolList.push(img.id.replaceAll("img_func_","").replaceAll("img_tool_",""));
    }
  });
  opts.showtools = toolList.length > 0 ? "showtools " + toolList.join(",") : "";
  opts.png_fontname = font_png.getFilename();


  // add config grub
  status.innerText = "Generating theme.conf...";
  zip.file(`${opts.id}/theme.conf`, fetchEval("html/config-refind-theme.txt"));
  
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
  selectors.update();

  let blob;
  //let svg = await fetchEval(`refind/selection_big.svg`);
  //let blob = await svg2image(svg, 'png', selectors.bigSize, selectors.bigSize);
  //let blob = await svg2image(selectors.iconData.big.data, 'png', selectors.iconData.big.size, selectors.iconData.big.size);
  blob = await selectors.iconData.getBlob('big');
  zip.file(`${opts.id}/selection_big.png`, blob.split(',')[1], { base64: true });
  
  //svg = await fetchEval(`refind/selection_small.svg`);
  //blob = await svg2image(svg, 'png', selectors.smallSize, selectors.smallSize);
  //blob = await svg2image(selectors.iconData.small.data, 'png', selectors.iconData.small.size, selectors.iconData.small.size);
  blob = await selectors.iconData.getBlob('small');
  zip.file(`${opts.id}/selection_small.png`, blob.split(',')[1], { base64: true });

  status.innerText = `Adding font`;
  blob = font_png.renderPng();
  zip.file(`${opts.id}/${opts.png_fontname}.png`, blob.split(',')[1], { base64: true });
  
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
  
  const confTimeout = document.getElementById('conf_timeout');
  if (confTimeout){
    confTimeout.addEventListener('change', function() {
      document.getElementById('div-shutdown').style.display = this.value > 0 ? 'inline-block' : 'none';
      document.getElementById('div-screensaver').style.display = this.value > 0 ? 'inline-block' : 'none';
    });
  }

  opts.ui_resize = 1;
  // loadData also inits panel_os and panel_tools
  menu.loadData();
}
