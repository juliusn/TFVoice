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
const Recording = require('../models/recording');
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
  const wavPath = req.file.path;
  const socket = req.app.clients.get(req.sessionID);
  if (req.badFileType) {
    return res.status(415).end(req.badFileType);
  }
  dsBinder.bind(wavPath).then((data) => {
    clear(wavPath);
    socket.emit('speech_data', data);
    res.sendStatus(200);
  });
});

router.post('/recording', uploadRecording.single('recording'), (req, res) => {
  const file = req.file;
  const wavPath = path.join(UPLOAD_PATH, file.filename + '.wav');
  const socket = req.app.clients.get(req.sessionID);
  ffmpeg().
      input(file.path).
      format('wav').
      on('end', transcodingReady).
      save(wavPath);

  function transcodingReady() {
    clear(file.path);
    dsBinder.bind(wavPath).then((data) => {
      clear(wavPath);
      const recording = new Recording({
        date: Date.now(),
        text: data,
      });
      recording.save().then((doc) => {
        res.status(200).send({recording_id: recording.id});
      });
    });
  }
});
module.exports = router;
