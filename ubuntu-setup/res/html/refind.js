
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

function renderSvg(){
  const img_preview = document.getElementById('img_preview');
  img_preview.src = encodeSvg(genSvg());
  updateIcons();
}

function updateIcons(){
  data.main.os_color = data.read('os_color');
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
  let font_size = data.main.os_iconsize / 10;
  let cap_title = svg.match('<title>(.*?)</title>')[1];
  let t = `<text x="48" y="22.5" fill="${data.main.os_color}" font-family="'${font.family}'" font-style="'${font.style}'" font-stretch="'${font.stretch}'" font-size="${font_size}px" font-weight="'${font.weight}'">${cap_title}</text>`
  svg = svg.replaceAll("<!--text-here-->", t);
  
  svg = svg.replaceAll("viewBox=\"0 0 32 32\"",`viewBox=\"0 0 ${opts.w_icon} 32\"`);
  const preset = data.main;
  return eval("`" + svg + "`");
}

async function exportMedia() {
   const zip = new JSZip();
  // add config grub
  zip.file(`${opts.id}/theme.conf`, fetchEval("html/config-refind.txt"));
  // add background
  zip.file(`${opts.id}/background.png`, getWpBlob('png', opts.resX, opts.resY), { base64: true });
  // add os-icons
  for (os of opts.osList) {
    let svg = await fetchText(`icons/${opts.grubSet}/${os}.svg`);
    svg = svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,`fill="${data.main.os_color}"`);
    svg = evalSvgIcon(svg);
    const blob = await svg2image(svg, 'png', data.main.os_iconsize_w, data.main.os_iconsize);
    zip.file(`${opts.id}/icons/${os}.png`, blob.split(',')[1], { base64: true });
  }
  // add grub-ui png
  opts.pngList.forEach(icon => {
    zip.file(`${opts.id}/${icon}.png`, fetchBlob(`refind/${icon}.png`));
  });
  // generate zip
  const content = await zip.generateAsync({ type: "blob" });
  // download
  utils.downloadBlob(content, `theme-${opts.id}.zip`);
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
