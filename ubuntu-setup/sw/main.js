const utils = {
  addOption: function(parent, val, txt, sel, click){
    const opt = utils.createOption(val, txt, sel);
    if (click)
      opt.addEventListener('click', click(parent));
    parent.appendChild(opt);
  },
  createOption: function(val, txt, sel){
    const o = document.createElement('option');
    o.value = val;
    o.textContent = txt;
    if (sel)
      o.selected = sel;
    return o;
  },
  downloadBlob: function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  getIntProperty: function(key){
    key = "--" + key.replace('--','');
    const v = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
    return parseInt(v);
  },
  fetchText: async function(url){
    const res = await fetch(url);
    const text = await res.text();
    return text;
  }
}

const dmain = {
  id: document.getElementById('main'),
  data: {},
  pwa: {},
  size: 6,
  load: async function(){
    this.data = JSON.parse(await utils.fetchText('setup.json'));
    this.pwa = JSON.parse(await utils.fetchText('pwa-edge.json'));
    this.data.pwa = { id: "grp-pwa", pkg: {}};
    Object.keys(this.pwa).forEach(pwa => {
      dmain.data.pwa.pkg[pwa] = {
        name: pwa,
        type: "pwa",
        args: dmain.pwa[pwa].url,
        pwa: dmain.pwa[pwa].id,
        prof: dmain.pwa[pwa].prof
      }
    });
    this.size = utils.getIntProperty('grid-max');
    Object.keys(this.data).forEach( group => dmain.addGroup(group));
  },
  addGroup: function(group){
    const g = this.data[group];
    const d = document.createElement('div');
    const l = document.createElement('label');
    const s = document.createElement('select');
    s.id = g.id;
    s.name = group;
    s.setAttribute('multiple',true);
    s.size = dmain.size;
    l.for = s.id;
    l.innerText = group;
    utils.addOption(s,'','none',false, dmain.selectNone(s));
    utils.addOption(s,'','all',false, dmain.selectAll(s));
    Object.keys(g.pkg).forEach(k => utils.addOption(s, JSON.stringify(g.pkg[k]), k, true));
    d.appendChild(l);
    d.appendChild(s);
    dmain.id.appendChild(d);
  },
  selectAll: function(parent){
    const excludes = [ 'none', 'all' ];
    parent.querySelectorAll('option').forEach(opt => opt.selected = excludes.includes(opt.value) ? false : true);
  },
  selectNone: function(parent){
    parent.querySelectorAll('option').forEach(opt => opt.selected = false);
  }
}

const versions = {
  llvm_sh: '',
  versions: {},
  llvm: async function(){
    const id  = document.getElementById('llvm');
    const url = "https://apt.llvm.org/llvm.sh";
    utils.addOption(id,'','no llvm');
    this.llvm_sh = await utils.fetchText(this.url);
    const st = parseInt(this.llvm_sh.match(/CURRENT_LLVM_STABLE=(\d+)/g)[0].match(/\d+/g)[0]);
    utils.addOption(id,st,`current (LLVM-${st})`);
    utils.addOption(id,(st+1),`stable (LLVM-${(st+1)})`);
    utils.addOption(id,(st+2),`qualification (LLVM-${(st+2)})`);
  }
}

const exec = {
  id: document.getElementById('exec'),
  sh: '',
  init: function(){
    this.id.addEventListener('click', this.gen);
    dmain.load();
    versions.llvm();
  },
  apt: function(v){
    exec.sh +=`\nsudo apt install ${v.args} -y`;
  },
  deb: function(v){
    exec.sh +=`
name=$(basename ${v.args})
echo "Downloading $name, please wait..."
wget -q "${v.args}"
sudo dpkg -i $name && rm $name
`;
    if (v.pkg)
      exec.sh += `sudo apt update && sudo apt install ${v.pkg} -y`
  },
  snap: function(v){
    exec.sh +=`\nsudo apt install ${v.args} -y`;
  },
  script: function(v){
    utils.fetchText(`scripts/${v.args}.sh`).then(res => exec.sh +=`\n${res}\n`);
  },
  pwa: function(v){
    exec.sh +=`
cat <<-EOF >\${HOME}/.local/share/applications/msedge-${v.pwa}-${v.prof}.desktop
#!/usr/bin/env xdg-open
[Desktop Entry]
Version=1.0
Terminal=false
Type=Application
Name=${v.name}
Exec=/opt/microsoft/msedge/microsoft-edge --profile-directory=${v.prof} --app-id=${v.pwa} "--app-url=${v.args}"
Icon=msedge-${v.pwa}-${v.prof}
StartupWMClass=crx__${v.pwa}
EOF
`;
  },
  gen: function(){
    exec.sh = '#!/bin/bash';
    dmain.id.querySelectorAll('select').forEach(s => {
      if (s.value){
        Array.from(s.selectedOptions).map(({ value }) => {
          const v1 = JSON.parse(value);
          try { exec[v1.type](v1); } catch(ignore){}
        });
      }
    });
    const blob = new Blob([exec.sh], { type: "text/plain" });
    utils.downloadBlob(blob,"install.sh");
  }
}

exec.init();