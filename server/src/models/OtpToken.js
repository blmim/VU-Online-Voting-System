const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hash: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login', 'password_reset'], default: 'register' },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

otpTokenSchema.index({ userId: 1, purpose: 1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
