const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const WordSchema = new Schema({
  word: {type: String, unique: true, required: true, dropDups: true},
});

module.exports = mongoose.model('Word', WordSchema);
