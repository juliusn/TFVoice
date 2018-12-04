const express = require('express');
const router = new express.Router();
const Recording = require('../models/Recording');
const Word = require('../models/Word');

router.get('/:id', function(req, res, next) {
  const id = req.params.id;
  let recording;
  const recQuery = Recording.findById(id);
  recQuery.exec(recQueryHandler);

  function recQueryHandler(error, doc) {
    if (error) return next(error);
    recording = doc;
    const wordQuery = Word.find({});
    wordQuery.exec(wordQueryHandler);
  }

  function wordQueryHandler(error, docs) {
    if (error) return next(error);
    const wordsArray = docs.map((word) => {
      return word.word;
    });
    res.render('results',
        {
          title: 'VoiceX Recording Results',
          recording: recording,
          result: wordCount(wordsArray, recording.text),
        });
  }
});

function wordCount(wordsToCount, text) {
  const allWords = text.split(' ');
  const register = {};
  const result = [];
  wordsToCount.map((word) => {
    register[word] = 0;
  });
  allWords.map((word) => {
    if (wordsToCount.includes(word)) register[word]++;
  });
  for (let word in register) {
    const count = register[word];
    if (count > 0) result.push({'name': word, 'count': register[word]});
  }
  return result;
}

module.exports = router;
