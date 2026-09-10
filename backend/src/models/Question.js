const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    maxlength: 1500,
    trim: true
  },
  optionA: {
    type: String,
    required: true,
    trim: true
  },
  optionB: {
    type: String,
    required: true,
    trim: true
  },
  optionC: {
    type: String,
    required: true,
    trim: true
  },
  optionD: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    trim: true
  },
  difficultyLevel: {
    type: String,
    trim: true
  },
  explanation: {
    type: String,
    maxlength: 1500,
    trim: true
  },
  weeklyTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyTest'
  },
  uploadBatchId: {
    type: String,
    trim: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
