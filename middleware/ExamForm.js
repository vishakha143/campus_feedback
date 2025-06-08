const mongoose = require('mongoose');

const ExamFormSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  examType: {
    type: String,
    enum: ['internal', 'external'],
    required: true,
  },
  branch: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
});

module.exports = mongoose.model('ExamForm', ExamFormSchema);