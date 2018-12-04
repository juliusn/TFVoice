const express = require('express');
const router = new express.Router();
const User = require('../models/User');

router.get('/:id', function(req, res, next) {
  const id = req.params.id;
  User.findById(id).then((user) => {
    console.log('User found', user);
    res.json(user);
  });
});

module.exports = router;
