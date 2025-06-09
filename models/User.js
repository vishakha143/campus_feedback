const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  tempPassword: { type: String },
  verified: { type: Boolean, default: false }
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true
});

userSchema.pre('save', async function(next) {
  if (this.isModified('tempPassword') && this.tempPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.tempPassword = await bcrypt.hash(this.tempPassword, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

userSchema.methods.setTempPassword = async function(tempPassword) {
  this.tempPassword = tempPassword;
  await this.save();
};

userSchema.methods.verifyTempPassword = async function(tempPassword) {
  if (!this.tempPassword) return false;
  return await bcrypt.compare(tempPassword, this.tempPassword);
};

module.exports = mongoose.model('User', userSchema);