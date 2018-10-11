const express = require('express');
const router = new express.Router();
const multer = require('multer');
const upload = multer(
    {dest: 'tmp/uploads/'}
);

router.post('/', upload.single('waves'), (req, res) => {
  console.log('uploaded ', req.file);
  return res.status(200).send();
});

module.exports = router;
