const mongoose = require('mongoose');

const categoryDurationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('CategoryDuration', categoryDurationSchema);
