"use strict";

var ffmpeg = null;
var loadBtn = null;
var transcodeBtn = null;
var videoEl = null;

const v = {
  ff:  '0.12.6', //0.12.15
  c:   '0.12.3', //0.12.10
  cmt: '0.12.3', //0.12.10
}

const ui = {
  bLoad: document.getElementById('load-button'),
  bTrans: document.getElementById('transcode-button'),
  iFiles: document.getElementById('uploader'),
  log: document.getElementById('log-div'),
  video: document.getElementById('video-result'),
  args: document.getElementById('ffargs'),
  furl: document.getElementById('ffurl'),
  loadFile: function(file){
    if (file){
      this.video.src = URL.createObjectURL(file);
      this.video.load();
      this.bTrans.removeAttribute('disabled');
    }
  }
}

const ffUtil = {
  ffmpeg: null,
  tryMultiThread: true,
  ffVersion: '0.12.6',
  ffCoreVersion: '0.12.3',
  urlFF: `https://unpkg.com/@ffmpeg/ffmpeg@${v.ff}/dist/umd`,
  urlCore: `https://unpkg.com/@ffmpeg/core@${v.c}/dist/umd`,
  urlCoreMT: `https://unpkg.com/@ffmpeg/core-mt@${v.cmt}/dist/umd`,
  toBlobURLPatched: async (url, mimeType, patcher) => {
    var resp = await fetch(url);
    var body = await resp.text();
    if (patcher) body = patcher(body);
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
  },
  toBlobURL: async (url, mimeType) => {
    var resp = await fetch(url);
    var body = await resp.blob();
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
  },
  fetchFile: async (url) => {
    var resp = await fetch(url);
    var buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
  },
  load: async (onload) => {
    const ffmpegBlobURL = await ffUtil.toBlobURLPatched(`${ffUtil.urlFF}/ffmpeg.js`, 'text/javascript', (js) => js.replace('new URL(e.p+e.u(814),e.b)', 'r.workerLoadURL'));
    await import(ffmpegBlobURL);
    ffUtil.ffmpeg = new FFmpegWASM.FFmpeg();
    ffUtil.ffmpeg.on('log', ({ message }) => {
      ui.log.innerText += message + '\n';
      console.log(message);
    });
    // check if SharedArrayBuffer is supported via crossOriginIsolated global var
    // https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
    if (ffUtil.tryMultiThread && window.crossOriginIsolated){
      await ffUtil.ffmpeg.load({
        workerLoadURL: await ffUtil.toBlobURL(`${ffUtil.urlFF}/814.ffmpeg.js`, 'text/javascript'),
        coreURL: await ffUtil.toBlobURL(`${ffUtil.urlCoreMT}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await ffUtil.toBlobURL(`${ffUtil.urlCoreMT}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await ffUtil.toBlobURL(`${ffUtil.urlCoreMT}/ffmpeg-core.worker.js`, 'application/javascript'),
      });
    } else {
        await ffUtil.ffmpeg.load({
          workerLoadURL: await ffUtil.toBlobURL(`${ffUtil.urlFF}/814.ffmpeg.js`, 'text/javascript'),
          coreURL: await ffUtil.toBlobURL(`${ffUtil.urlCore}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await ffUtil.toBlobURL(`${ffUtil.urlCore}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }
    console.log('ffmpeg.load success');
    if (onload) onload();
  },
  transcodeFile: async (inExt, inData, outExt, strArgs) => {
    const ffargs = strArgs.trim().split(' ');
    await ffUtil.ffmpeg.writeFile(`input.${inExt}`, inData);
    await ffUtil.ffmpeg.exec(['-i', `input.${inExt}`, ...ffargs, `output.${outExt}`]);
    const data = await ffUtil.ffmpeg.readFile(`output.${outExt}`);
    return data;
  },
  transcodeUrl: async (inUrl, outExt, strArgs) => {
    const ffargs = strArgs.trim().split(' ');
    await ffUtil.ffmpeg.exec(['-i', inUrl, ...ffargs, `output.${outExt}`]);
    const data = await ffUtil.ffmpeg.readFile(`output.${outExt}`);
    return data;
  }
}


const inputData = {
  file: null,
  data: null,
  extIn: 'webm',
  extOut: 'mp4',
  setFile: async function (file){
    if (file){
      this.file = file;
      const ext = file.name.split('.').pop().toLowerCase();
      this.extIn = ext;
      const arrayBuffer = await inputData.file.arrayBuffer();
      inputData.data = new Uint8Array(arrayBuffer);
      ui.loadFile(inputData.file);
    }
  }
}

async function transcode(){
  if (ui.furl.innerText.startsWith('https')){
    await ffUtil.transcodeUrl(ui.furl.innerText, inputData.extOut, ui.args.innerText);
  } else if (inputData.file){
    await ffUtil.transcodeFile(inputData.extIn, inputData.data, inputData.extOut, ui.args.innerText);
  } else {
    ui.log.innerText = "No input file or URL specified.\n";
  }
}

addEventListener("load", async (event) => {
  ui.iFiles.addEventListener('change', async (event) => inputData.setFile(event.target.files[0]));
  ui.bLoad.addEventListener('click', async () => await ffUtil.load(() => ui.bLoad.style.display = 'none'));
  ui.bLoad.removeAttribute('disabled');
  ui.bTrans.addEventListener('click', async () => await transcode());
  console.log('window loaded');
});