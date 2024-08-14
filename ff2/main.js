const message = document.getElementById('message');
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: true,
  progress: ({ ratio }) => {
    message.innerHTML = `Complete: ${(ratio * 100.0).toFixed(2)}%`;
  },
});

const transcode = async ({ target: { files }  }) => {
  const { name } = files[0];
  message.innerHTML = 'Loading ffmpeg-core.js';
  await ffmpeg.load();
  message.innerHTML = 'Start transcoding';
  ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
  await ffmpeg.run('-i', name,  'output.mp4');
  message.innerHTML = 'Complete transcoding';
  const data = ffmpeg.FS('readFile', 'output.mp4');
 
  const video = document.getElementById('output-video');
  video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
}
document.getElementById('uploader').addEventListener('change', transcode);

import { init, Wasmer } from "@wasmer/sdk";

await init();

const transcode = async ({ target: { files }  }) => {
  let ffmpeg = await Wasmer.fromRegistry("wasmer/ffmpeg");
  let resp = await fetch("https://cdn.wasmer.io/media/wordpress.mp4");
  let video = await resp.arrayBuffer();

  // We take stdin ("-") as input and write the output to stdout ("-") as a
  // WAV audio stream.
  const instance = await ffmpeg.entrypoint.run({
    args: ["-i", "-", "-f", "wav", "-"],
    stdin: new Uint8Array(video),
  });

  const { stdoutBytes } = await instance.wait();
  console.log(`The audio stream: ${output.stdoutBytes}`);
}
document.getElementById('uploader').addEventListener('change', transcode);