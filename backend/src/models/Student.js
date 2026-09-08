const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  courseName: {
    type: String,
    trim: true
  },
  trainerName: {
    type: String,
    trim: true
  },
  registerDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  mockTestAllowed: {
    type: Boolean,
    default: false
  },
  assignedMockModel: {
    type: String,
    default: 'Model 1',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
