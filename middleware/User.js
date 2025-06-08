const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
  },
  branch: {
    type: String,
    enum: ['CSE', 'ECE', 'Mechanical', ''],
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  profilePic: {
    type: String,
  },
});

module.exports = mongoose.model('User', UserSchema);