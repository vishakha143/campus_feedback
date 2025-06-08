const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['internal', 'external', 'practical'],
    required: true
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
  difficultyCategory: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Examination', examinationSchema);