"use strict";

var ffmpeg = null;
var loadBtn = null;
var transcodeBtn = null;
var logDiv = null;
var videoEl = null;
var tryMultiThread = true;
const baseURLFFMPEG = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd';
const baseURLCore = 'https://unpkg.com/@ffmpeg/core@0.12.3/dist/umd';
const baseURLCoreMT = 'https://unpkg.com/@ffmpeg/core-mt@0.12.3/dist/umd';

const toBlobURLPatched = async (url, mimeType, patcher) => {
    var resp = await fetch(url);
    var body = await resp.text();
    if (patcher) body = patcher(body);
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
};

const toBlobURL = async (url, mimeType) => {
    var resp = await fetch(url);
    var body = await resp.blob();
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
};

const fetchFile = async (url) => {
    var resp = await fetch(url);
    var buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
};

const inputData = {
    file: null,
}

document.getElementById('uploader').addEventListener('change', async (event) => {
    inputData.file = event.target.files[0];
});

const load = async () => {
    loadBtn.setAttribute('disabled', true);
    const ffmpegBlobURL = await toBlobURLPatched(`${baseURLFFMPEG}/ffmpeg.js`, 'text/javascript', (js) => js.replace('new URL(e.p+e.u(814),e.b)', 'r.workerLoadURL'));
    await import(ffmpegBlobURL);
    ffmpeg = new FFmpegWASM.FFmpeg();
    ffmpeg.on('log', ({ message }) => {
        logDiv.innerHTML = message;
        console.log(message);
    });
    // check if SharedArrayBuffer is supported via crossOriginIsolated global var
    // https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated
    if (tryMultiThread && window.crossOriginIsolated){
        transcodeBtn.innerHTML = 'Transcode webm to mp4 (multi-threaded)';
        await ffmpeg.load({
            workerLoadURL: await toBlobURL(`${baseURLFFMPEG}/814.ffmpeg.js`, 'text/javascript'),
            coreURL: await toBlobURL(`${baseURLCoreMT}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURLCoreMT}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURLCoreMT}/ffmpeg-core.worker.js`, 'application/javascript'),
        });
    } else {
        transcodeBtn.innerHTML = 'Transcode webm to mp4 (single-threaded)';
        await ffmpeg.load({
            workerLoadURL: await toBlobURL(`${baseURLFFMPEG}/814.ffmpeg.js`, 'text/javascript'),
            coreURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }
    console.log('ffmpeg.load success');
    transcodeBtn.removeAttribute('disabled');
}

const tryFetchInputFile = async () => {
    if (inputData.file) {
        return await inputData.file.arrayBuffer();
    } else {
        return await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm');
    }
};

const transcode = async () => {
    transcodeBtn.setAttribute('disabled', true);
    await ffmpeg.writeFile('input.webm', await tryFetchInputFile());
    await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');
    videoEl.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
}

addEventListener("load", async (event) => {
    loadBtn = document.querySelector('#load-button');
    loadBtn.addEventListener('click', async () => await load());
    loadBtn.removeAttribute('disabled');
    transcodeBtn = document.querySelector('#transcode-button');
    transcodeBtn.addEventListener('click', async () => await transcode());
    logDiv = document.querySelector('#log-div');
    videoEl = document.querySelector('#video-result');
    console.log('window loaded');
});