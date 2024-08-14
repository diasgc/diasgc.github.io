import { init, Wasmer } from "@wasmer/sdk";

await init();

const transcode = async ({ target: { files }  }) => {
  let ffmpeg = await Wasmer.fromRegistry("wasmer/ffmpeg");
  let resp = await fetch(files[0]);
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