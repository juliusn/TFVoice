const express = require('express');
const router = new express.Router();
const Recording = require('../models/recording');

router.get('/:id', function(req, res, next) {
  const id = req.params.id;
  Recording.findById(id).then((recording) => {
    console.log('Recording found', recording);
    res.render('results',
        {
          title: 'VoiceX Recording Results',
          recording: recording,
          result: wordCount(['um', 'uh', 'well'], recording.text),
        });
  }).catch((error) => {
    console.error(error);
    throw error;
  });
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
