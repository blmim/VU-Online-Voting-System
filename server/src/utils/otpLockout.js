const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_FAILURES = 3;

function isLocked(user) {
  return user.lockedUntil && user.lockedUntil > new Date();
}

async function recordOtpFailure(user) {
  user.otpFailures += 1;
  if (user.otpFailures >= MAX_FAILURES) {
    user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
  }
  await user.save();
}

function clearOtpFailures(user) {
  user.otpFailures = 0;
  user.lockedUntil = undefined;
}

module.exports = { isLocked, recordOtpFailure, clearOtpFailures, LOCKOUT_MS, MAX_FAILURES };
