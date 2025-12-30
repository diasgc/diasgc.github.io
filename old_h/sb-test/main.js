if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/old_h/sb-test/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const data = {
  password: null,
  filename: null,
  jdata: null,
  addOpt: function(s, v){
    const option = document.createElement('option');
    option.value = v;
    option.text = v;
    s.appendChild(option);
  },
  load: function(obj){
    data.jdata = obj;
    // Populate selects
    const ssrc = ui.ssrc;
    ssrc.innerHTML = '';
    Object.keys(obj.src).forEach(src => data.addOpt(ssrc, src));
    data.upd();
    ui.panel.style.display = 'block';
    ui.panel.classList.toggle('hidden');
  },
  includeAny: function(i, tags){
    for (let t of tags){
      if (data.jdata.data[i] && data.jdata.data[i].includes(t)){
        return true;
      }
    }
    return false;
  },
  includeAll: function(i, tags){
    for (let t of tags){
      if (data.jdata.data[i] && !data.jdata.data[i].includes(t)){
        return false;
      }
    }
    return true;
  },
  upd: function(){
    const sid = ui.sid;
    const tag = ui.stag;
    sid.innerHTML = '';
    if (tag.innerText.trim() === ''){
      Object.keys(data.jdata.data).forEach(i => data.addOpt(sid, i));
    } else {
      const tags = tag.innerText.trim().split(' ');
      const fn = `include${ui.sflt.value}`;
      const filtered = Object.keys(data.jdata.data).filter(i => data[fn](i, tags));
      filtered.forEach(i => data.addOpt(sid, i));
    }
  }
}

const ui = {
  iframe: document.getElementById('iframe'),
  panel:  document.getElementById('m-top'),
  bload:  document.getElementById('s-load'),
  ssrc:   document.getElementById('s-src'),
  sid:    document.getElementById('s-id'),
  stag:   document.getElementById('s-tag'),
  sflt:   document.getElementById('s-flt'),
  inactivityTimer: null,
  panelTimeout: 5000,
  init: function(){
    document.addEventListener('mousemove', ui.resetInactivityTimer);
    document.addEventListener('keydown', ui.resetInactivityTimer);
    document.addEventListener('click', ui.resetInactivityTimer);
    document.addEventListener('touchstart', ui.resetInactivityTimer);
    ui.sid.addEventListener('change', () => {
      let url = `https://${ui.ssrc.value}${data.jdata.src[ui.ssrc.value]}${ui.sid.value}`;
      console.log(url);
      ui.iframe.src = url;
    });
    ui.stag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        data.upd();
      }
    });
    ui.resetInactivityTimer();
    ui.bload.addEventListener('click', () => {
      ui.loadCat();
    });
  },
  loadCat: function(){
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
      const file = e.target.files[0];
      //actions.filename = file.name;
      const reader = new FileReader();
      reader.onload = function(event) {
        const encrypted = event.target.result;
        const pw = ui.requestPassword();
        try {
          const decrypted = CryptoJS.AES.decrypt(encrypted, pw).toString(CryptoJS.enc.Utf8);
          data.load(JSON.parse(decrypted));
          ui.bload.style.display = 'none';
          //alert('Loaded!');
        } catch (e) {
          alert('Failed to decrypt. Check your password.');
        }
      }
      reader.readAsText(file);
    }
    input.click();

  },
  requestPassword: function() {
    const pwd = prompt('Enter your password:');
    return pwd;
  },

  resetInactivityTimer: function(){
    clearTimeout(ui.inactivityTimer);
    ui.panel.classList.remove('hidden');
    ui.inactivityTimer = setTimeout(() => {
      ui.panel.classList.add('hidden');
    }, ui.panelTimeout);
}
}

function setUrl(){
  ui.iurl.innerText = ui.iframe.contentWindow.location.href;
}

document.addEventListener('DOMContentLoaded', () => {
  ui.init();
});