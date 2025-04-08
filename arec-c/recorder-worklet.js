// recorder-worklet.js
class RecorderWorkletProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
      const input = inputs[0];
      if (input.length > 0) {
          const left = input[0];
          const right = input[1];
          const samples = new Int16Array(left.length * 2);
          
          for (let i = 0; i < left.length; i++) {
              samples[i * 2] = this.floatTo16BitPCM(left[i]);
              samples[i * 2 + 1] = this.floatTo16BitPCM(right[i]);
          }
          
          this.port.postMessage(samples);
      }
      return true;
  }

  floatTo16BitPCM(sample) {
      sample = Math.max(-1, Math.min(1, sample));
      return sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
}

registerProcessor('recorder-worklet', RecorderWorkletProcessor);