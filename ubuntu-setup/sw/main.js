

const main = document.getElementById('main');

const utils = {
  addOption: function(parent, val, txt, selected){
    parent.appendChild(this.createOption(val, txt, selected));
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
    this.size = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--grid-max").trim());
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
    const none = utils.createOption('none','none');
    none.addEventListener('click', () => dmain.selectNone(s));
    s.appendChild(none);
    const all = utils.createOption('all','all');
    all.addEventListener('click', () => dmain.selectAll(s));
    s.appendChild(all);
    Object.keys(g.pkg).forEach(k => utils.addOption(s, JSON.stringify(g.pkg[k], true), k));
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

dmain.load();

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
