const mongoose = require('mongoose');
const config = require('../config');

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      validate: {
        validator: (v) => config.studentIdRegex.test(v),
        message: 'Student ID must match format S#######',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (v) => config.vuEmailRegex.test(v),
        message: 'Must use VU institutional email s#######@live.vu.edu.au',
      },
    },
    fullName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
    faculty: { type: String, default: 'IT' },
    department: { type: String, default: 'Computer Science' },
    year: { type: Number, default: 1, min: 1, max: 5 },
    isVerified: { type: Boolean, default: false },
    referenceSelfiePath: { type: String },
    referenceSelfieHash: { type: String },
    otpFailures: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ fullName: 'text', studentId: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
