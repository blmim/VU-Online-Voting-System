const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const AuditLog = require('../models/AuditLog');
const { generateOtp, hashOtp, verifyOtpHash, otpExpiry } = require('../utils/otp');
const { sendTemplate } = require('../services/emailService');
const { saveSelfie } = require('../services/faceVerification');
const { authenticate, signToken } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const { isLocked, recordOtpFailure, clearOtpFailures, LOCKOUT_MS, MAX_FAILURES } = require('../utils/otpLockout');
const config = require('../config');

const LOCKOUT_MINUTES = Math.round(LOCKOUT_MS / 60000);

function authUserPayload(user) {
  return {
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    studentId: user.studentId,
    email: user.email,
    isVerified: user.isVerified,
    faculty: user.faculty,
    year: user.year,
  };
}

/** Local demo: SMTP often fails or VU emails are not readable — expose OTP only outside production. */
function attachDevOtp(payload, otp, mailResult) {
  if (process.env.NODE_ENV === 'production') return payload;
  const smtpFailed = Boolean(mailResult?.devMode);
  return {
    ...payload,
    devOtp: otp,
    emailDelivered: !smtpFailed,
    devHint: smtpFailed
      ? 'Gmail/SMTP is not delivering (check App Password). Use the code below for local demo — also printed in the server terminal as [DEV EMAIL].'
      : 'Development mode: OTP also shown here because seeded accounts use @live.vu.edu.au (not your personal Gmail inbox).',
  };
}

async function maybeSendLockoutEmail(user, sendTemplate) {
  if (isLocked(user) && user.otpFailures === MAX_FAILURES) {
    try {
      await sendTemplate(user.email, 'accountLocked', user.fullName, LOCKOUT_MINUTES);
    } catch (err) {
      console.error('Lockout alert email failed:', err.message);
    }
  }
}

const router = express.Router();

router.post(
  '/register',
  [
    body('studentId').matches(config.studentIdRegex).withMessage('Invalid student ID format'),
    body('email').matches(config.vuEmailRegex).withMessage('Must use VU email'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('fullName').notEmpty(),
    body('faculty').optional(),
    body('department').optional(),
    body('year').optional().isInt({ min: 1, max: 5 }),
    body('selfie').notEmpty().withMessage('Reference selfie required'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { studentId, email, password, fullName, faculty, department, year, selfie } = req.body;
      const sid = studentId.toUpperCase();
      const em = email.toLowerCase();

      const existing = await User.findOne({ $or: [{ email: em }, { studentId: sid }] });
      if (existing) return res.status(409).json({ error: 'Account already exists' });

      const selfieData = await saveSelfie(selfie, 'ref', sid);
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        studentId: sid,
        email: em,
        fullName,
        passwordHash,
        faculty: faculty || 'IT',
        department: department || 'Computer Science',
        year: year || 1,
        referenceSelfiePath: selfieData.relativePath,
        referenceSelfieHash: selfieData.hash,
      });

      const otp = generateOtp();
      await OtpToken.findOneAndUpdate(
        { userId: user._id, purpose: 'register' },
        { hash: hashOtp(otp), expiry: otpExpiry(), purpose: 'register' },
        { upsert: true }
      );

      const mail = await sendTemplate(em, 'otp', otp, 'registration');
      await AuditLog.appendLog({
        event: 'USER_REGISTERED',
        userId: user._id,
        ipAddress: req.ip,
      });

      res.status(201).json(attachDevOtp({ message: 'OTP sent to email', userId: user._id }, otp, mail));
    } catch (err) {
      console.error('Register error:', err.message);
      // Selfie/image validation messages are safe for clients (status 400)
      if (err.status && err.status < 500 && err.message) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/verify-otp',
  [body('userId').notEmpty(), body('otp').isLength({ min: 6, max: 6 })],
  handleValidation,
  async (req, res) => {
    try {
      const { userId, otp } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const token = await OtpToken.findOne({ userId, purpose: 'register' });
      if (!token) return res.status(404).json({ error: 'No pending verification' });
      if (token.expiry < new Date()) {
        await OtpToken.deleteOne({ _id: token._id });
        return res.status(410).json({ error: 'OTP expired' });
      }

      if (!verifyOtpHash(otp, token.hash)) {
        await recordOtpFailure(user);
        await maybeSendLockoutEmail(user, sendTemplate);
        if (isLocked(user)) {
          return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
        }
        return res.status(400).json({ error: 'Incorrect OTP' });
      }

      user.isVerified = true;
      clearOtpFailures(user);
      await user.save();
      await OtpToken.deleteOne({ _id: token._id });

      const jwt = signToken(user);
      setAuthCookie(res, jwt);
      await sendTemplate(user.email, 'registrationWelcome', user.fullName);
      await AuditLog.appendLog({ event: 'OTP_VERIFIED', userId: user._id, ipAddress: req.ip });

      res.json({ message: 'Verified', token: jwt, user: authUserPayload(user) });
    } catch (err) {
      console.error('Verify OTP error:', err.message);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').matches(config.vuEmailRegex).withMessage('Must use VU email'),
    body('password').notEmpty(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        await recordOtpFailure(user);
        await maybeSendLockoutEmail(user, sendTemplate);
        if (isLocked(user)) {
          return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Login always requires email OTP after a correct password (MFA).
      const otp = generateOtp();
      await OtpToken.findOneAndUpdate(
        { userId: user._id, purpose: 'login' },
        { hash: hashOtp(otp), expiry: otpExpiry(), purpose: 'login' },
        { upsert: true }
      );
      const mail = await sendTemplate(user.email, 'otp', otp, 'login');
      return res.json(attachDevOtp({ message: 'OTP sent', requireOtp: true, userId: user._id }, otp, mail));
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.post(
  '/verify-login-otp',
  [body('userId').notEmpty(), body('otp').isLength({ min: 6, max: 6 })],
  handleValidation,
  async (req, res) => {
    try {
      const { userId, otp, rememberMe } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const token = await OtpToken.findOne({ userId, purpose: 'login' });
      if (!token) return res.status(404).json({ error: 'No pending verification' });
      if (token.expiry < new Date()) {
        await OtpToken.deleteOne({ _id: token._id });
        return res.status(410).json({ error: 'OTP expired' });
      }
      if (!verifyOtpHash(otp, token.hash)) {
        await recordOtpFailure(user);
        await maybeSendLockoutEmail(user, sendTemplate);
        if (isLocked(user)) {
          return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
        }
        return res.status(400).json({ error: 'Incorrect OTP' });
      }

      await OtpToken.deleteOne({ _id: token._id });
      clearOtpFailures(user);
      await user.save();
      const jwt = signToken(user, rememberMe);
      setAuthCookie(res, jwt, rememberMe);
      await sendTemplate(user.email, 'loginAlert', user.fullName, req.ip);
      await AuditLog.appendLog({ event: 'LOGIN_OTP_VERIFIED', userId: user._id, ipAddress: req.ip });
      res.json({ token: jwt, user: authUserPayload(user) });
    } catch (err) {
      console.error('Verify login OTP error:', err.message);
      res.status(500).json({ error: 'Login verification failed' });
    }
  }
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post(
  '/forgot-password',
  [
    body('email').matches(config.vuEmailRegex).withMessage('Must use VU email'),
    body('studentId').matches(config.studentIdRegex).withMessage('Invalid student ID format'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const email = req.body.email.toLowerCase();
      const studentId = req.body.studentId.toUpperCase();
      const user = await User.findOne({ email, studentId });

      if (!user) {
        return res.json({
          message: 'If an account matches those details, a reset code has been sent to your email.',
        });
      }
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const otp = generateOtp();
      await OtpToken.findOneAndUpdate(
        { userId: user._id, purpose: 'password_reset' },
        { hash: hashOtp(otp), expiry: otpExpiry(15), purpose: 'password_reset' },
        { upsert: true }
      );

      const mail = await sendTemplate(user.email, 'passwordReset', otp, user.fullName);
      await AuditLog.appendLog({
        event: 'PASSWORD_RESET_REQUESTED',
        userId: user._id,
        ipAddress: req.ip,
      });

      res.json(
        attachDevOtp(
          {
            message: 'If an account matches those details, a reset code has been sent to your email.',
          },
          otp,
          mail
        )
      );
    } catch (err) {
      console.error('Forgot password error:', err.message);
      res.status(500).json({ error: 'Unable to process password reset request' });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('email').matches(config.vuEmailRegex).withMessage('Must use VU email'),
    body('studentId').matches(config.studentIdRegex).withMessage('Invalid student ID format'),
    body('otp').isLength({ min: 6, max: 6 }),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const email = req.body.email.toLowerCase();
      const studentId = req.body.studentId.toUpperCase();
      const { otp, password } = req.body;
      const user = await User.findOne({ email, studentId });
      if (!user) return res.status(404).json({ error: 'Invalid reset request' });
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const token = await OtpToken.findOne({ userId: user._id, purpose: 'password_reset' });
      if (!token) return res.status(404).json({ error: 'No pending password reset' });
      if (token.expiry < new Date()) {
        await OtpToken.deleteOne({ _id: token._id });
        return res.status(410).json({ error: 'Reset code expired — request a new one' });
      }

      if (!verifyOtpHash(otp, token.hash)) {
        await recordOtpFailure(user);
        await maybeSendLockoutEmail(user, sendTemplate);
        if (isLocked(user)) {
          return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
        }
        return res.status(400).json({ error: 'Incorrect reset code' });
      }

      user.passwordHash = await bcrypt.hash(password, 12);
      clearOtpFailures(user);
      await user.save();
      await OtpToken.deleteOne({ _id: token._id });

      await AuditLog.appendLog({
        event: 'PASSWORD_RESET_COMPLETED',
        userId: user._id,
        ipAddress: req.ip,
      });

      await sendTemplate(user.email, 'passwordResetComplete', user.fullName);

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('Reset password error:', err.message);
      res.status(500).json({ error: 'Unable to reset password' });
    }
  }
);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

      user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
      await user.save();

      await AuditLog.appendLog({
        event: 'PASSWORD_CHANGED',
        userId: user._id,
        ipAddress: req.ip,
      });

      await sendTemplate(user.email, 'passwordChanged', user.fullName);

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err.message);
      res.status(500).json({ error: 'Unable to change password' });
    }
  }
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

router.post(
  '/resend-otp',
  [
    body('purpose').isIn(['register', 'login', 'password_reset']),
    body('userId').optional().notEmpty(),
    body('email').optional().matches(config.vuEmailRegex),
    body('studentId').optional().matches(config.studentIdRegex),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { purpose } = req.body;
      let user = null;
      if (req.body.userId) {
        user = await User.findById(req.body.userId);
      } else if (req.body.email && req.body.studentId) {
        user = await User.findOne({
          email: req.body.email.toLowerCase(),
          studentId: req.body.studentId.toUpperCase(),
        });
      } else {
        return res.status(400).json({ error: 'userId or email+studentId required' });
      }

      if (!user) {
        return res.json({ message: 'If an account exists, a new verification code has been sent.' });
      }
      if (isLocked(user)) {
        return res.status(429).json({ error: 'Account locked — try again in 15 minutes' });
      }

      const otp = generateOtp();
      const expiryMinutes = purpose === 'password_reset' ? 15 : 10;
      await OtpToken.findOneAndUpdate(
        { userId: user._id, purpose },
        { hash: hashOtp(otp), expiry: otpExpiry(expiryMinutes), purpose },
        { upsert: true }
      );

      let mail;
      if (purpose === 'password_reset') {
        mail = await sendTemplate(user.email, 'passwordReset', otp, user.fullName);
      } else {
        const label = purpose === 'login' ? 'login' : 'registration';
        mail = await sendTemplate(user.email, 'otp', otp, label);
      }

      await AuditLog.appendLog({
        event: 'OTP_RESENT',
        userId: user._id,
        ipAddress: req.ip,
        metadata: { purpose },
      });

      res.json(
        attachDevOtp({ message: 'A new verification code has been sent to your email.' }, otp, mail)
      );
    } catch (err) {
      console.error('Resend OTP error:', err.message);
      res.status(500).json({ error: 'Unable to resend verification code' });
    }
  }
);

module.exports = router;
