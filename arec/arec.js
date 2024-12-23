
const divMain = document.getElementById('div-main');
const startStopButton = document.getElementById('startStop');

const timer = {
  id: document.getElementById('timer'),
  startTime: 0,
  start: function(){
    this.startTime = Date.now();
    //this.timerInterval = setInterval(this.updateTimer, 1000);
  },
  updateTimer: function(){
    const elapsedTime = Date.now() - this.startTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
  
    const formattedTime = 
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
  
    this.id.innerText = formattedTime;
  },
  stop: function(){
    //this.timerInterval = clearInterval(this.timerInterval);
    this.id.innerText = "00:00:00";
  }
}

const micCtl = {
  micOn: document.getElementById('rec-mc1'),
  start: function(){

  }
}

function rmic(){
  if (micCtl.micOn.checked){
    divMain.disabled = false;
    divMain.style.opacity = 1;
    navigator.mediaDevices.getUserMedia({ audio: true });
    startStopButton.disabled = false;
  } else {
    divMain.disabled = true;
    divMain.style.opacity = 0.1;
    startStopButton.disabled = true;
    if (stream)
      stream.getTracks().forEach(track => track.stop());

  }
  
}

const inputCtl = {
  ch2: document.getElementById('rec-ch2'),
  b16: document.getElementById('rec-b16'),
  agc: document.getElementById('rec-ag1'),
  nrx: document.getElementById('rec-nr1'),
  ech: document.getElementById('rec-ec1'),
  srt: [ "rec-s08", "rec-s11", "rec-s22", "rec-s44", "rec-s48", "rec-s96" ],
  getOptions: function(){
    let srate = this.srt.forEach( e => {
      let id = document.getElementById(e);
      if (id.checked)
        return id.value;
    });
    return {
      echoCancellation: this.ech.checked,
      noiseSuppression: this.nrx.checked,
      autoGainControl: this.agc.checked,
      sampleRate: srate,
      channelCount: this.ch2.checked ? 2 : 1,
      volume: 1.0,
      sampleSize: this.b16.checked ? 16 : 8,
      latency: 0
    }
  }
}

const outputCtl = {
  btr: [ "rec-r32", "rec-r64", "rec-r128", "rec-r192", "rec-r256", "rec-r320", "rec-r480", "rec-r512" ],
  vbr: document.getElementById('rec-b16'),
  cod: [ "rec-mp3", "rec-ogg", "rec-wav", "rec-webm" ],
  supportedMimeTypes: [],
  mimeType: "audio/webm;codecs=opus",
  containers: [],
  codecs: [],
  ext: 'ogg',
  getOptions: function(){
    let btr = this.btr.forEach( e => {
      let id = document.getElementById(e);
      if (id.checked)
        return id.value;
    });
    return {
      audioBitsPerSecond : btr,
      audioBitrateMode : this.vbr.checked ? "variable" : "constant",
      mimeType: "audio/webm;codecs=opus"
    }
  },

  loadSupportedAudioMimeTypes: function(){
    this.supportedMimeTypes = this.getAllSupportedMimeTypes('audio');
    let fs = document.getElementById('fs-mime');
    fs.replaceChildren();
    this.supportedMimeTypes.forEach( e => {
      if (e.match('\"'))
        return;
      let sp = e.replaceAll('audio/', '').split(';codecs=');
      let id = sp[0] + ( sp[1] ? '-' + sp[1] : '' );
      let input = document.createElement('input');
      // <input type="radio" id="rec-mp3"  name="codec" value="mp3"/><label for="rec-mp3">mp3</label>
      input.type = "radio";
      input.id = id;
      input.onchange = function(){
        if (input.checked){
          outputCtl.mimeType = e;
          outputCtl.ext = sp[0].replace('mp4', 'm4a');
          console.log("Selected: " + outputCtl.mimeType + " ext: " + outputCtl.ext);
        }
      };
      input.name = "codec";
      input.value = e;
      let label = document.createElement('label');
      label.setAttribute("for",id);
      label.innerText = e.replace('audio/', '').replace(';codecs=', '/');
      fs.appendChild(input);
      fs.appendChild(label);
    })
  },

  getAllSupportedMimeTypes(...mediaTypes) {
    if (!mediaTypes.length) mediaTypes.push('video', 'audio')
    const CONTAINERS = ['webm', 'ogg', 'mp3', 'mp4', 'x-matroska', '3gpp', '3gpp2', '3gp2', 'quicktime', 'mpeg', 'aac', 'flac', 'x-flac', 'wave', 'wav', 'x-wav', 'x-pn-wav', 'not-supported']
    const CODECS = ['vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1', 'h265', 'h.265', 'h264', 'h.264', 'opus', 'vorbis', 'pcm', 'aac', 'mpeg', 'mp4a', 'rtx', 'red', 'ulpfec', 'g722', 'pcmu', 'pcma', 'cn', 'telephone-event', 'not-supported']
    
    return [...new Set(
      CONTAINERS.flatMap(ext =>
          mediaTypes.flatMap(mediaType => [
            `${mediaType}/${ext}`,
          ]),
      ),
    ), ...new Set(
      CONTAINERS.flatMap(ext =>
        CODECS.flatMap(codec =>
          mediaTypes.flatMap(mediaType => [
            // NOTE: 'codecs:' will always be true (false positive)
            `${mediaType}/${ext};codecs=${codec}`,
          ]),
        ),
      ),
    ), ...new Set(
      CONTAINERS.flatMap(ext =>
        CODECS.flatMap(codec1 =>
        CODECS.flatMap(codec2 =>
          mediaTypes.flatMap(mediaType => [
            `${mediaType}/${ext};codecs="${codec1}, ${codec2}"`,
          ]),
        ),
        ),
      ),
    )].filter(variation => MediaRecorder.isTypeSupported(variation))
  }
}

function rcfg(){
  streamConfig = inputCtl.getOptions();
  console.log(streamConfig);
}

function saveFile(data, filename, type) {
  const blob = new Blob([data], { type: type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function updateTimer() {
  const elapsedTime = Date.now() - startTime;
  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

  const formattedTime = 
    `${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;

  timer.innerText = formattedTime;
}

function getTimestampFilename(ext) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `rec-${year}${month}${day}-${hours}${minutes}${seconds}.${ext}`;
}

let stream;
let recorder;
let lock;
let timerInterval;

rmic();

outputCtl.loadSupportedAudioMimeTypes();

function startStop(){
  if (startStopButton.checked)
    startRecording();
  else
    stopRecording();
}

startRecording = async() => {
  stream = await navigator.mediaDevices.getUserMedia({ audio: inputCtl.getOptions() });
  lock = await navigator.wakeLock.request('screen');
  recorder = new MediaRecorder(stream, outputCtl.getOptions());
  
  const suggestedName = getTimestampFilename(outputCtl.ext);
  //const handle = await window.showSaveFilePicker({ suggestedName });
  //const writable = await handle.createWritable();

  let chunks = [];
  // Start recording.
  recorder.start();
  recorder.addEventListener("dataavailable", async (event) => {
    // Write chunks to the file.
    //await writable.write(event.data);
    chunks.push(event.data);
    if (recorder.state === "inactive") {
      // Close the file when the recording stops.
      //await writable.close();
      saveFile(new Blob(chunks, { type: "audio/ogg" }), suggestedName, "audio/ogg");
    }
  });

  // Start the timer
  timer.start();
  timerInterval = setInterval(timer.updateTimer, 1000);
}

stopRecording = async() => {
  // Stop the recording.
  recorder.stop();
  timer.stop();
  timerInterval = clearInterval(timerInterval);
  if (lock != null){
    await lock.release();
    lock = null;
  }
}
        