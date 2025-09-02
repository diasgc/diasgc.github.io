
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

async function exportMedia() {
  alert("Warning: Not Implemented. Yet!...");
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