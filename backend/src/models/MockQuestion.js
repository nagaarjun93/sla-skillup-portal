const mongoose = require('mongoose');

const mockQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    maxlength: 1500,
    trim: true
  },
  optionA: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  optionB: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  optionC: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  optionD: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Mock Test',
    trim: true
  },
  topic: {
    type: String,
    default: 'General Aptitude',
    trim: true
  },
  modelSet: {
    type: String,
    default: 'Model 1',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MockQuestion', mockQuestionSchema);
