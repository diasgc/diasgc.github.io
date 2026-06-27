const renderCap = document.getElementById('grub_rendercap');
const osSizeInput = document.getElementById("os_size");

opts.iconList = [ 'ubuntu', 'windows', 'macosx' ]; //'tool_memtest', 'tool_mok_tool', 'tool_netboot', 'tool_part', 'tool_rescue' ];

const menu = {
  id: document.getElementById('os-panel-grub'),
  iconData: {},
  import: async function(path){
    let svg = await fetchText(path);
    return svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,"fill=\"${preset.os_color}\"");
  },
  loadData: async function(){
    opts.scaleX = window.devicePixelRatio;
    opts.iconList = [];
    this.id.querySelectorAll('[id^="img_"]')
      .forEach(async img => {
        let name = img.id.replace("img_","");
        opts.iconList.push(name);
        menu.iconData[name] = await this.import(`icons/${opts.grubSet}/${name}.svg`);
      });
  },
  update: function(rect){
    let x = document.getElementById('grub_menu_x').value,
        y = document.getElementById('grub_menu_y').value,
        w = document.getElementById('grub_menu_w').value,
        h = document.getElementById('grub_menu_h').value;
    if (rect.width === 0) rect.width = opts.resX;
    if (rect.height === 0) rect.height = opts.resY;
    menu.id.style.left = (rect.left + x / 100 * rect.width)  + 'px';
    menu.id.style.top  = (rect.top  + y / 100 * rect.height) + 'px';
    menu.id.style.width = w / 100 * rect.width + 'px';
    menu.id.style.height = h / 100 * rect.height + 'px';
    data.main.grub_menu_h = h + "%";
    data.main.grub_menu_w = w + "%";
    data.main.grub_menu_x = x + "%";
    data.main.grub_menu_y = y + "%";
  },
}

function renderSvg(){
  const img_preview = document.getElementById('img_preview');
  img_preview.src = encodeSvg(genSvg());
  opts.img_rect = img_preview.getBoundingClientRect();
  opts.ui_resize = opts.img_rect.width > 0 ? opts.resX / opts.img_rect.width : 1;
  menu.update(opts.img_rect);
  updateIcons();
}

function updateIcons(){
  data.main.os_color = data.read('os_color');
  let label;
  if (renderCap.checked){
    opts.w_icon = 8;
    label = 'none';
  } else {
    opts.w_icon = 1;
    label = 'flex';
    document.querySelectorAll('.os-square-grub-label').forEach(e => {
      e.style.fontFamily = data.main.font_family.family;
      e.style.fontStyle = data.main.font_family.style;
      e.style.fontWeight = data.main.font_family.weight;
      e.style.fontStretch = data.main.font_family.stretch;
      e.style.fontSize = data.main.os_iconsize / opts.ui_resize / 2 + 'px';
    });
  }

  data.main.os_iconsize = osSizeInput.value * window.devicePixelRatio;
  data.main.os_iconsize_w = data.main.os_iconsize * opts.w_icon;
  opts.w_icon *= 32;
  document.documentElement.style.setProperty("--os-size-w", (data.main.os_iconsize_w / opts.ui_resize) + "px");
  document.documentElement.style.setProperty("--os-size", (data.main.os_iconsize / opts.ui_resize) + "px");
  
  opts.iconList.forEach(icon => {
    if (menu.iconData[icon]){
      const svg = genSvgIcon(icon);
      document.getElementById(`img_${icon}`).src = encodeSvg(svg);
      document.getElementById(`grub-label-${icon}`).style.display = label;
    }
  });
}

function genSvgIcon(name){
  //let svg = document.getElementById(`os_${name}`).textContent;
  let svg = menu.iconData[name];
  return svg = evalSvgIcon(svg);
}

function evalSvgIcon(svg){
  if (renderCap.checked){
    let font = data.main.font_family;
    let font_size = data.main.os_iconsize / opts.ui_resize / 2;
    let cap_title = svg.match('<title>(.*?)</title>')[1];
    let t = `<text x="48" y="22.5" fill="${data.main.os_color}" font-family="'${font.family}'" font-style="'${font.style}'" font-stretch="'${font.stretch}'" font-size="${font_size}px" font-weight="'${font.weight}'">${cap_title}</text>`
    svg = svg.replaceAll("<!--text-here-->", t);
  }
  svg = svg.replaceAll("viewBox=\"0 0 32 32\"",`viewBox=\"0 0 ${opts.w_icon} 32\"`);
  const preset = data.main;
  return eval("`" + svg + "`");
}

async function exportMedia(){
  const zip = new JSZip();
  // add config grub
  zip.file("theme.txt", fetchEval("html/config-grub.txt"));
  // add background
  zip.file('background.png', getWpBlob('png', opts.resX, opts.resY), { base64: true });
  // add os-icons
  for (os of opts.osList) {
    let svg = await fetchText(`icons/${opts.grubSet}/${os}.svg`);
    svg = svg.replaceAll(/fill="#[0-9a-fA-F]+"/gi,`fill="${data.main.os_color}"`);
    svg = evalSvgIcon(svg);
    const blob = await svg2image(svg, 'png', data.main.os_iconsize_w, data.main.os_iconsize);
    zip.file(`icons/${os}.png`, blob.split(',')[1], { base64: true });
  }
  // add grub-ui png
  opts.pngList.forEach(icon => {
    zip.file(`${icon}.png`, fetchBlob(`grub/${icon}.png`));
  });
  // generate zip
  const content = await zip.generateAsync({ type: "blob" });
  // download
  utils.downloadBlob(content, `theme-${opts.id}.zip`);

}

function initComponents(){
  menu.loadData();
  opts.ui_resize = opts.ui_resize || 1;
  
  function setOsSize(){
    document.documentElement.style.setProperty("--os-size", data.main.os_iconsize / opts.ui_resize + "px");
  }

  if (osSizeInput) {
    data.main.os_iconsize = osSizeInput.value;
    data.main.os_iconsize_w = osSizeInput.value;    
    osSizeInput.addEventListener("input", setOsSize);
    setOsSize();
  }

  window.addEventListener('resize', renderSvg);
}