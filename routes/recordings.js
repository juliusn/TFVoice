const express = require('express');
const router = new express.Router();
const Recording = require('../models/Recording');

router.get('/', (req, res, next) => {
  const query = Recording.find({});
  query.exec((error, recordings) => {
    if (error) return next(error);
    res.status(200).json(recordings);
  });
});

module.exports = router;
