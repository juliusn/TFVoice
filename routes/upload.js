const express = require('express');
const router = new express.Router();
const util = require('util');
const fs = require('fs');
const clear = util.promisify(fs.unlink);
const multer = require('multer');
const UPLOAD_PATH = 'tmp/uploads/';
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const dsBinder = require('../libraries/deepspeech/dsbinder');
const uploadWave = multer({
  dest: UPLOAD_PATH,
  fileFilter: function(req, file, cb) {
    const filetypes = /wave|wav/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      cb(undefined, true);
    } else {
      req.badFileType = 'Only audio/wav files are supported.';
      cb(undefined, false);
    }
  },
});
const uploadRecording = multer({
  dest: UPLOAD_PATH,
});

router.post('/file', uploadWave.single('wave'), (req, res) => {
  const file = req.file;
  const socket = req.app.clients.get(req.sessionID);
  if (req.badFileType) {
    return res.status(415).end(req.badFileType);
  }
  res.sendStatus(200);
  dsBinder.bind(file.path).then((data) => {
    socket.emit('speech_data', data);
    clear(file.path);
  });
});

router.post('/recording', uploadRecording.single('recording'), (req, res) => {
  res.sendStatus(200);
  const file = req.file;
  const wavPath = path.join(UPLOAD_PATH, file.filename + '.wav');
  const socket = req.app.clients.get(req.sessionID);
  // const stream = fs.createWriteStream(wavPath);
  ffmpeg().
      input(file.path).
      format('wav').
      on('start', (commandLine) => {
        console.log(`Spawned Ffmpeg with command: ${commandLine}`);
      }).
      on('codecData', (data) => {
        console.log(`Input is ${data.audio}`);
      }).
      on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}%`);
      }).
      on('stderr', (stderrLine) => {
        console.log(`Stderr output: ${stderrLine}`);
      }).
      on('error', (err) => {
        console.error(`Transcoding error: ${err}`);
        throw err;
      }).
      on('end', () => {
        console.log('Processing finished');
        clear(file.path);
        dsBinder.bind(wavPath).then((data) => {
          socket.emit('speech_data', data);
          clear(wavPath);
        });
      }).save(wavPath);
});

module.exports = router;
