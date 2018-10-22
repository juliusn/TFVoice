const express = require('express');
const router = new express.Router();
const multer = require('multer');
const UPLOAD_PATH = 'tmp/uploads/';
const path = require('path');

const upload = multer({
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
const fs = require('fs');
const {promisify} = require('util');
const clear = promisify(fs.unlink);

router.post('/', upload.single('wave'), (req, res) => {
  const file = req.file;
  if (req.badFileType) {
    return res.status(415).end(req.badFileType);
  }
  clear(file.path);
  return res.sendStatus(200);
});

module.exports = router;
