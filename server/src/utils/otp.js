const crypto = require('crypto');

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/** Constant-time compare of a plaintext OTP against a stored SHA-256 hex hash. */
function verifyOtpHash(otp, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const computed = Buffer.from(hashOtp(otp), 'utf8');
  const expected = Buffer.from(storedHash, 'utf8');
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}

function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = { generateOtp, hashOtp, verifyOtpHash, otpExpiry };
