const mongoose = require('mongoose');

const weeklyTestSchema = new mongoose.Schema({
  weekNumber: {
    type: Number
  },
  title: {
    type: String,
    trim: true
  },
  weekName: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  passMarks: {
    type: Number,
    default: 0
  },
  passPercentage: {
    type: Number,
    default: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

weeklyTestSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.startTime && now < this.startTime) {
    return 'Upcoming';
  }
  if (this.endTime && now > this.endTime) {
    return 'Completed';
  }
  return 'Live';
});

module.exports = mongoose.model('WeeklyTest', weeklyTestSchema);
