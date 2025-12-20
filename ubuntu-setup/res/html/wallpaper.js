const out_format = document.getElementById("out_format");
out_format.addEventListener("change", () => wallpaper.imgFormat = out_format.value);
  
wallpaper.current = 'light';
wallpaper.count = 2;
wallpaper.imgFormat = 'webp';

wallpaper.types = {
  "1": {
    img_dir: () => `${opts.home}/Pictures/Wallpapers`,
    xml_dir: () => '',
    count: () => 1,
    thumbs: 'none',
    add: 'none'
  },
  "2": {
    img_dir: () => `${opts.home}/Pictures/Wallpapers`,
    xml_dir: () => `${opts.home}/.local/share/gnome-background-properties`,
    ts_dir: () => '',
    count: () => 2,
    thumbs: 'block',
    add: 'none'
  },
  "3": {
    img_dir: () => `${opts.home}/.local/share/backgrounds/time-shift`,
    xml_dir: () => `${opts.home}/.local/share/gnome-background-properties`,
    ts_dir: () => `${opts.home}/.local/share/backgrounds/time-shift`,
    count: () => Object.keys(wallpaper.presets).length,
    thumbs: 'block',
    add: 'none'
  },
}

const grid = document.querySelector(".wp-grid");
const wp_cell_add = document.getElementById("wp-cell-add");
const wpType = document.getElementById("wp_type");

wpType.addEventListener("change", () => {
  const thumbs = document.getElementById("wp_preview_ctrl");
  wallpaper.type = wpType.value;
  switch (wpType.value) {
    case "1":
      thumbs.style.display = "none";
      wallpaper.count = 1;
      wp_cell_add.style.display = "none";
      wallpaper.img_dir = `${opts.home}/Pictures/Wallpapers`;
      wallpaper.xml_dir = ``;
      break; // single
    case "2":
      thumbs.style.display = "block"; // daynight
      wp_cell_add.style.display = "none";
      wallpaper.count = 2;
      wallpaper.img_dir = `${opts.home}/Pictures/Wallpapers`;
      wallpaper.xml_dir = `${opts.home}/.local/share/gnome-background-properties`
      break;
    case "3":
      thumbs.style.display = "block";
      wallpaper.count = Object.keys(wallpaper.presets).length;
      wp_cell_add.style.display = "block";
      wallpaper.xml_dir = `${opts.home}/.local/share/gnome-background-properties`
      wallpaper.ts_dir = `${opts.home}/.local/share/backgrounds/time-shift`;
      wallpaper.img_dir = wallpaper.ts_dir;
      break; // timeshift
  }
  renderSvg();
});

function getWpName(prefix){
  return `${prefix}-${opts.id}.${wallpaper.imgFormat}`;
}

function l_oadPreset(name) {
  // merge presets onto current preset
  data.main = { ...data.main, ...wallpaper.presets[name] };
  // load ui values to preset
  wallpaper.keys.forEach(key => {
    let id = document.getElementById(key);
    if (id)
      id.value = data.main[key];
  });
  renderSvg();
}

function renderSvg(){
  const svg = encodeSvg(genSvg());
  wallpaper.id.src = svg;
  data.main.wp_light = `${opts.home}/Pictures/Wallpapers/theme-light-${opts.id}.${wallpaper.imgFormat}`;
  data.main.wp_dark = `${opts.home}/Pictures/Wallpapers/theme-dark-${opts.id}.${wallpaper.imgFormat}`;
  data.main.options = document.getElementById("wp_options").value;
  data.main.shadertype = document.getElementById("wp_shader").value;
  data.main.pcolor = document.getElementById("wp_pcolor").value;
  data.main.scolor = document.getElementById("wp_scolor").value;
  if (wpType && wpType.value > 1)
    document.getElementById(`img_preview_${data.main.current}`).src = svg;
}

function getWpTsConfig(){
  /* https://linuxconfig.org/how-to-create-gnome-dynamic-wallpapers */
  return `<?xml version="1.0"?>
<!DOCTYPE wallpapers SYSTEM "gnome-wp-list.dtd">
<wallpapers>
  <wallpaper deleted="false">
    <name>Time-shift ${opts.id}</name>
    <filename>${wallpaper.ts_dir}/${opts.id}.xml</filename>
    <options>${data.main.options}</options>
  </wallpaper>
</wallpapers>`
}

function genWpTimeShift(keys){
  wallpaper.ts_y = 2025;
  wallpaper.ts_d = 24 * 3600 / wallpaper.count;
  wallpaper.ts_td = 3600;
  wallpaper.ts_xml = '';
  for (let i = 0; i < wallpaper.count; i++) {
    let j = (i + 1) % wallpaper.count;
    wallpaper.ts_path1 = `${wallpaper.ts_dir}/theme-${keys[i]}-${opts.id}.${wallpaper.imgFormat}`;
    wallpaper.ts_path2 = `${wallpaper.ts_dir}/theme-${keys[j]}-${opts.id}.${wallpaper.imgFormat}`;
    wallpaper.ts_xml += getWptsBlock();
  }
}

function getWptsBlock(){
  return `
  <static>
    <file>${wallpaper.ts_path1}</file>
    <duration>${wallpaper.ts_d}</duration>
  </static>
  <transition type="overlay">
    <duration>${wallpaper.ts_td}</duration>
    <from>${wallpaper.ts_path1}</from>
    <to>${wallpaper.ts_path2}</to>
  </transition>`
}

function getWptsXml(keys){
  genWpTimeShift(keys);
  return `<background>
  <starttime>
    <year>${wallpaper.ts_y}</year>
    <month>1</month>
    <day>0</day>
    <hour>0</hour>
    <minute>0</minute>
    <second>0</second>
  </starttime>
  ${wallpaper.ts_xml}
</background>`
}

async function exportMedia() {
  const zip = new JSZip();
  const old = data.main.current;
  const keys = Object.keys(data.presets);
  for (let i = 0; i < wallpaper.count; i++) {
    wallpaper.loadPreset(keys[i]);
    zip.file(
      `theme-${keys[i]}-${opts.id}.${wallpaper.imgFormat}`,
      getWpBlob(wallpaper.imgFormat, opts.resX, opts.resY),
      { base64: true }
    );
  }
  wallpaper.loadPreset(old);
  if (wallpaper.type === "2") {
    const config = await fetchEval('html/config-wp.xml');
    wallpaper.wp_xml = `wp-${opts.id}-daynight.xml`;
    zip.file(wallpaper.wp_xml, config);
  } else if (wallpaper.type === "3") {
    wallpaper.wp_xml = `wp-${opts.id}-timeshift.xml`;
    zip.file(wallpaper.wp_xml, getWpTsConfig());
    zip.file(`${opts.id}.xml`, getWptsXml(keys));
  }
  zip.file(`install.sh`, getScript());
  const content = await zip.generateAsync({ type: "blob" });
  utils.downloadBlob(content, `theme-${opts.id}.zip`);
}

function getScript(){
  let script = `#!/bin/bash
mkdir -p ${wallpaper.img_dir}
cp theme-*${opts.id}.${wallpaper.imgFormat} ${wallpaper.img_dir}/`
  if (wallpaper.wp_xml){
    script +=`\ncp ${wallpaper.wp_xml} ${wallpaper.xml_dir}/`
  }
  if (wallpaper.ts_dir) {
    script +=`\ncp ${opts.id}.xml ${wallpaper.ts_dir}/`;
  }
  script +="\nnecho 'Done!'"
  return script;
}

function delPreset(e) {
  const id = e.id.split('-')[2];
  const cell = document.getElementById(`preset_${id}`);
  grid.removeChild(cell);
  wallpaper.count--;
  wallpaper.presets[id] = null;
}

function loadPresetCell(e) {
  const id = e.id.split('_')[1];
  wallpaper.loadPreset(id);
}

function addPreset() {
  wallpaper.count++;
  
  const id = grid.childElementCount;
  const str = `
  <div class="wp-cell" id="preset_${id}" onclick="loadPresetCell(this)">
    <img class="img-prev" id="img_preview_${id}" alt="preview" />
    <div class="wp-cell-label">${id}</div>
    <div class="wp-cell-del" id="wp-del-${id}" onclick="delPreset(this)"></div>
  </div>`;
  // copy last preset or light
  const srcKey = Object.keys(wallpaper.presets)[id - 4] || "light";
  wallpaper.presets[id] = {...wallpaper.presets[srcKey]};
  wallpaper.presets[id].current = id;
  const t = document.createElement('template');
  t.innerHTML = str.trim();
  grid.insertBefore(t.content.firstChild, wp_cell_add);
  wallpaper.loadPreset(id);
}

function initComponents() {
  const wp_light = document.getElementById("preset_light");
  const wp_dark = document.getElementById("preset_dark");
  wp_light.addEventListener("click", () => wallpaper.loadPreset("light"));
  wp_dark.addEventListener("click", () => wallpaper.loadPreset("dark"));
  wp_cell_add.addEventListener("click", addPreset);
  wp_cell_add.style.display = "none";
  wallpaper.loadPreset("light");
  wallpaper.loadPreset("dark");
}