const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    required: true,
    enum: ['midterm', 'final', 'practical']
  },
  examDate: {
    type: Date,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Examination', examinationSchema);