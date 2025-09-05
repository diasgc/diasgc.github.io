

const utils = {
  addOption: function(parent, val, txt, selected=false){
    parent.appendChild(this.createOption(val, txt, selected));
  },
  createOption: function(val, txt, selected=false){
    const o = document.createElement('option');
    o.value = val;
    o.textContent = txt;
    if (selected)
      o.selected = selected;
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
        type: "pwa",
        args: pwa.url,
        pwa: pwa.id
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

const llvm_sh = {
  url: 'https://apt.llvm.org/llvm.sh',
  id: document.getElementById('llvm'),
  sh: '',
  versions: {},
  load: async function(){
    utils.addOption(this.id,'','no llvm');
    this.sh = await utils.fetchText(this.url);
    const st = parseInt(this.sh.match(/CURRENT_LLVM_STABLE=(\d+)/g)[0].match(/\d+/g)[0]);
    utils.addOption(this.id,st,`current (LLVM-${st})`);
    utils.addOption(this.id,(st+1),`stable (LLVM-${(st+1)})`);
    utils.addOption(this.id,(st+2),`qualification (LLVM-${(st+2)})`);
  }
}

const exec = {
  id: document.getElementById('exec'),
  scr: '',
  ppa: [],
  apt: [],
  deb: [],
  flathub: [],
  snap: [],
  pwa: [],
  script: [],
  init: function(){
    this.id.addEventListener('click', this.gen);
    dmain.load();
    llvm_sh.load();
  },
  gen: function(){
    exec.scr = '#!/bin/bash';
    dmain.id.querySelectorAll('select').forEach(s => {
      if (s.value){
        Array.from(s.selectedOptions).map(({ value }) => {
          const v1 = JSON.parse(value);
          console.log(`${s.id}: ${value}`);
          if (exec[v1.type]){
            exec[v1.type].push(v1.args);
            if (v1.pkg)
              exec.apt.push(v1.pkg);
            if (v1.ppa)
              exec.ppa.push(v1.ppa);
          } else
            console.log(`Unknown type ${v1.type}`);
        });
      }
    });
    if (exec.ppa.length > 0)
      exec.scr +=`\nsudo add-apt-repository ${exec.ppa.join(' ')} -y && sudo apt update`;
    if (exec.deb.length > 0)
      exec.deb.forEach(deb => {
        exec.scr += `\nname=$(basename ${deb})\necho "Downloading $name, please wait..."\nwget -q "${deb}"\nsudo dpkg -i $name && rm $name`;
      });
    if (exec.apt.length > 0)
      exec.scr +=`\nsudo apt install ${exec.apt.join(' ')} -y`;
    if (exec.snap.length > 0)
      exec.scr +=`\nsudo snap install ${exec.snap.join(' ')}`;
    if (exec.script.length > 0)
      exec.script.forEach(async script => {
        await utils.fetchText(`scripts/${script}.sh`).then(res => exec.scr +=`\n${res}\n`);
      });
    if (exec.pwa.length > 0)
      exec.scr +=`\nsudo pwa install ${exec.pwa.join(' ')}`;
    const blob = new Blob([exec.scr], { type: "text/plain" });
    utils.downloadBlob(blob,"install.sh");
  },
  genDeb: function(){

  }
}

exec.init();