const express = require('express');
const router = new express.Router();
const Word = require('../models/Word');
const upload = require('multer')();

router.get('/', (req, res, next) => {
  const query = Word.find({});
  query.exec((error, words) => {
    if (error) return next(error);
    res.status(200).json(words);
  });
});

router.get('/delete/:id', (req, res, next) => {
  const id = req.params.id;
  Word.deleteOne({_id: id}, (error) => {
    if (error) return next(error);
    res.status(200).send();
  });
});

router.post('/', upload.fields([]), (req, res, next) => {
  console.log(req.body);
  const query = Word.findOne({'word': req.body.word});
  query.exec((error, word) => {
    if (word) {
      return res.status(400).send('Word already saved!');
    }
    saveWord();
  });

  function saveWord() {
    const word = new Word({
      word: req.body.word,
    });
    word.save((error) => {
      if (error) return next(error);
      res.status(201).send('Word added!');
    });
  }
});

module.exports = router;
