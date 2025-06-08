const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teachingStyle: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  contentDelivery: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  engagement: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comments: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

FeedbackSchema.index({ teacher: 1, student: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);