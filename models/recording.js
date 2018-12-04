const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RecordingSchema = new Schema({
  date: Date,
  text: String,
});

module.exports = mongoose.model('Recording', RecordingSchema);
