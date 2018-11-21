const fs = require('fs');
const ds = require('deepspeech');
const path = require('path');
const MemoryStream = require('memory-stream');
const sox = require('sox-stream');
const MODEL_ROOT = './libraries/deepspeech/models/';
const MODEL_PATH = path.join(MODEL_ROOT, 'output_graph.pbmm');
const FEATURES = 26;
const CONTEXT = 9;
const ALPHABET_PATH = path.join(MODEL_ROOT, 'alphabet.txt');
const BEAM_WIDTH = 500;
const LM_PATH = path.join(MODEL_ROOT, 'lm.binary');
const TRIE_PATH = path.join(MODEL_ROOT, 'trie');
const LM_WEIGHT = 1.50;
const VALID_WORD_COUNT_WEIGHT = 2.10;
const options = {
  soxPath: './libraries/sox-14.4.2/sox',
  global: {
    'no-dither': true,
  },
  output: {
    bits: 16,
    rate: 16000,
    channels: 1,
    encoding: 'signed-integer',
    endian: 'little',
    compression: 0.0,
    type: 'raw',
  },
};

const bind = (path) => {
  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream(path);
    const transform = sox(options);
    const audioStream = new MemoryStream();
    readable.pipe(transform).pipe(audioStream);
    audioStream.on('finish', () => {
      audioBuffer = audioStream.toBuffer();
      console.log('Loading model');
      const modelLoadStart = process.hrtime();
      const model = new ds.Model(MODEL_PATH, FEATURES, CONTEXT, ALPHABET_PATH,
          BEAM_WIDTH);
      const modelLoadEnd = process.hrtime(modelLoadStart);
      console.log('Loaded model in %ds.', totalTime(modelLoadEnd));
      const lmLoadStart = process.hrtime();
      model.enableDecoderWithLM(ALPHABET_PATH, LM_PATH, TRIE_PATH, LM_WEIGHT,
          VALID_WORD_COUNT_WEIGHT);
      const lmLoadEnd = process.hrtime(lmLoadStart);
      console.log('Loaded language model in %ds.', totalTime(lmLoadEnd));
      const inferenceStart = process.hrtime();
      console.log('Running inference.');
      const audioLength = (audioBuffer.length / 2) * (1 / 16000);
      const output = model.stt(audioBuffer.slice(0, audioBuffer.length / 2),
          16000);
      const inferenceStop = process.hrtime(inferenceStart);
      console.log('Inference took %ds for %ds audio file.',
          totalTime(inferenceStop), audioLength.toPrecision(4));
      resolve(output);
    });
  });
};

module.exports = {
  bind: bind,
};

function totalTime(hrtimeValue) {
  return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
}