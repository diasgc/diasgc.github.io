

const main = document.getElementById('main');

const utils = {
  addOption: function(parent, val, txt){
    parent.appendChild(this.createOption(val, txt));
  },
  createOption: function(val, txt){
    const o = document.createElement('option');
    o.value = val;
    o.textContent = txt;
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

llvm_sh.load();

const pwa = {
  id: document.getElementById('sw-pwa'),
  data: {},
  load: async function(){
    this.data = JSON.parse(await utils.fetchText('pwa-edge.json'));
    Object.keys(this.data).forEach(k => {
      utils.addOption(pwa.id, k,k);
    });
  },
  getSelected: function(){

  }
}

pwa.load();