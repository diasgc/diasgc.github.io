    const iframe = document.getElementById('iframe');
    const iUrl = document.getElementById('i-url');
    const mTop = document.querySelector('.m-top');
    let inactivityTimer;

    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      mTop.classList.remove('hidden');
      inactivityTimer = setTimeout(() => {
        mTop.classList.add('hidden');
      }, 5000);
    }

    // Track activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('touchstart', resetInactivityTimer);

    iUrl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        let url = iUrl.innerText.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        iframe.src = url;
      }
    });
    function setUrl(location) {
      iUrl.innerText = iframe.src;
      let iframeDoc = this.contentDocument || this.contentWindow.document;
      let audios = iframeDoc.querySelectorAll('audio, video');
      audios.forEach(el => el.muted = true);
    }

    // Initialize timer
    resetInactivityTimer();