if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/old_h/sb/serviceWorker.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

const ui = {

  iframe: document.getElementById('iframe'),
  iurl:   document.getElementById('i-url'),
  panel:  document.getElementById('m-top'),
  inactivityTimer: null,
  panelTimeout: 5000,

  init: function(){
    document.addEventListener('mousemove', ui.resetInactivityTimer);
    document.addEventListener('keydown', ui.resetInactivityTimer);
    document.addEventListener('click', ui.resetInactivityTimer);
    document.addEventListener('touchstart', ui.resetInactivityTimer);
    ui.iurl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        let url = ui.iurl.innerText.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        ui.iframe.src = url;
      }
    });
    ui.resetInactivityTimer();
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



/*
const iframe = document.getElementById('iframe');
const iUrl = document.getElementById('i-url');
const mTop = document.querySelector('.m-top');
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(ui.inactivityTimer);
  ui.panel.classList.remove('hidden');
  ui.inactivityTimer = setTimeout(() => {
    ui.panel.classList.add('hidden');
  }, 5000);
}

function setUrl(frame) {
  ui.iurl.innerText = frame.contentWindow.location.href;
}

// Initialize timer
ui.resetInactivityTimer();
*/
