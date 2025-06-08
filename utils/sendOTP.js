const nodemailer = require('nodemailer');
  const OTP = require('../models/OTP');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });

  async function saveAndSendOTP(email) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpRecord = new OTP({ email, otp });
      await otpRecord.save();

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP for CampusConnect',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`
      };

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', email);
      return true;
    } catch (err) {
      console.error('Error sending OTP to', email, ':', err);
      return false;
    }
  }

  module.exports = { saveAndSendOTP };