const mongoose = require('mongoose');

const mockSettingsSchema = new mongoose.Schema({
  passingMarks: {
    type: Number,
    default: 35
  },
  durationMinutes: {
    type: Number,
    default: 45
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MockSettings', mockSettingsSchema);
