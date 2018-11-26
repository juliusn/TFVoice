const express = require('express');
const router = new express.Router();
const util = require('util');
const fs = require('fs');
const clear = util.promisify(fs.unlink);
const multer = require('multer');
const UPLOAD_PATH = 'tmp/uploads/';
const path = require('path');
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
  console.log('Bound');
});

router.post('/recording', uploadRecording.single('recording'), (req, res) => {
  const file = req.file;
  console.log('file', req.file);
  res.sendStatus(200);
  const socket = req.app.clients.get(req.sessionID);
  dsBinder.bind(file.path).then((data) => {
    socket.emit('speech_data', data);
    clear(file.path);
  });
});

module.exports = router;
