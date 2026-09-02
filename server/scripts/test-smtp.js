/** Quick SMTP verification — run from server/: node scripts/test-smtp.js recipient@example.com */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

const to = process.argv[2] || process.env.SMTP_USER;

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.verify();
  console.log('SMTP verify: OK');

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'VU Online Voting — OTP SMTP test',
    text: 'If you received this, Gmail App Password SMTP is working for OTP delivery.',
  });
  console.log('Sent:', info.messageId);
}

main().catch((err) => {
  console.error('SMTP test failed:', err.message);
  process.exit(1);
});
