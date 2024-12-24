
const startMicrophoneButton = document.querySelector('#startMicrophoneButton');
const stopMicrophoneButton = document.querySelector('#stopMicrophoneButton');
const startRecordButton = document.querySelector('#startRecordButton');
const stopRecordButton = document.querySelector('#stopRecordButton');

let stream;
let recorder;

startMicrophoneButton.addEventListener("click", async () => {
  // Prompt the user to use their microphone.
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const options = { 
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond : 256000,
    audioBitrateMode : "variable",
    channelCount : 2,
  };
  recorder = new MediaRecorder(stream, options);

  stopMicrophoneButton.disabled = false;
  startRecordButton.disabled = false;
  log("Your microphone audio is being used.");
});

stopMicrophoneButton.addEventListener("click", () => {
  // Stop the stream.
  stream.getTracks().forEach(track => track.stop());

  startRecordButton.disabled = true;
  stopRecordButton.disabled = true;
  console.log("Your microphone audio is not used anymore.");
});


startRecordButton.addEventListener("click", async () => {
  // For the sake of more legible code, this sample only uses the
  // `showSaveFilePicker()` method. In production, you need to
  // cater for browsers that don't support this method, as
  // outlined in https://web.dev/patterns/files/save-a-file/.

  // Prompt the user to choose where to save the recording file.
  const suggestedName = "microphone-recording.ogg";
  const handle = await window.showSaveFilePicker({ suggestedName });
  const writable = await handle.createWritable();

  // Start recording.
  recorder.channelCount = 2;
  recorder.sampleRate = 48000;
  recorder.start();
  recorder.addEventListener("dataavailable", async (event) => {
    // Write chunks to the file.
    await writable.write(event.data);
    if (recorder.state === "inactive") {
      // Close the file when the recording stops.
      await writable.close();
    }
  });

  stopRecordButton.disabled = false;
  console.log("Your microphone audio is being recorded locally.");
});

stopRecordButton.addEventListener("click", () => {
  // Stop the recording.
  recorder.stop();

  stopRecordButton.disabled = true;
  console.log("Your microphone audio has been successfully recorded locally.");
});
        