const mongoose = require('mongoose');

const mockResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  wrongAnswers: {
    type: Number,
    required: true
  },
  passStatus: {
    type: String,
    required: true,
    enum: ['PASS', 'FAIL']
  },
  passed: {
    type: Boolean,
    default: false
  },
  percentage: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number
  },
  answersJson: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

mockResultSchema.pre('save', function(next) {
  this.passed = this.passStatus === 'PASS';
  next();
});

module.exports = mongoose.model('MockResult', mockResultSchema);
