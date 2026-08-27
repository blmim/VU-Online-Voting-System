require('dotenv').config();

const WEAK_JWT_DEFAULTS = new Set([
  'dev-secret-change-in-production',
  'change-this-to-a-long-random-secret-key',
]);
const WEAK_RECEIPT_DEFAULTS = new Set([
  'receipt-dev-secret',
  'change-this-receipt-hmac-secret',
]);

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const receiptSecret = process.env.RECEIPT_SECRET || 'receipt-dev-secret';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || WEAK_JWT_DEFAULTS.has(jwtSecret) || jwtSecret.length < 32) {
    throw new Error(
      'FATAL: Set a strong JWT_SECRET (min 32 chars) in production. Do not use .env.example defaults.'
    );
  }
  if (
    !process.env.RECEIPT_SECRET ||
    WEAK_RECEIPT_DEFAULTS.has(receiptSecret) ||
    receiptSecret.length < 32
  ) {
    throw new Error(
      'FATAL: Set a strong RECEIPT_SECRET (min 32 chars) in production. Do not use .env.example defaults.'
    );
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/online_voting_system',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  receiptSecret,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Victoria University Election Services <noreply@vu.edu.au>',
  },
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.65'),
  faceAnomalyThreshold: parseFloat(process.env.FACE_ANOMALY_THRESHOLD || '0.45'),
  studentIdRegex: /^S\d{7}$/i,
  vuEmailRegex: /^s\d{7}@live\.vu\.edu\.au$/i,
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  maxSelfieBytes: parseInt(process.env.MAX_SELFIE_BYTES || '5242880', 10),
  // Production: terminate TLS at reverse proxy (nginx/ALB); set TRUST_PROXY=true
  trustProxy: process.env.TRUST_PROXY === 'true',
  // Test data generator: enabled in non-production; set ALLOW_TEST_GENERATOR=true to override in prod
  allowTestGenerator:
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_GENERATOR === 'true',
  // Login MFA: OTP is always required after password. Set REQUIRE_LOGIN_OTP=false only for emergency local bypass.
  requireLoginOtp: process.env.REQUIRE_LOGIN_OTP !== 'false',
};
