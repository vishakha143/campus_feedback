const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  teachingStyle: { type: Number, min: 1, max: 5 },
  contentDelivery: { type: Number, min: 1, max: 5 },
  engagement: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);