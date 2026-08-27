const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: config.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };

  // Jest / CI: never block on real SMTP (bad .env credentials caused 30–60s hangs).
  if (process.env.NODE_ENV === 'test') {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, devMode: true, testMode: true };
  }

  try {
    const info = await getTransporter().sendMail(mailOptions);
    return { success: true, messageId: info.messageId, preview: nodemailer.getTestMessageUrl?.(info) };
  } catch (err) {
    console.error('SMTP error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      console.log(`[DEV EMAIL BODY] ${mailOptions.text}`);
      return { success: true, devMode: true };
    }
    throw err;
  }
}

const signature = '<p>Regards,<br />Victoria University Election Services</p>';

const templates = {
  otp: (otp, purpose) => ({
    subject: `Victoria University Election Services - ${purpose} verification code`,
    html: `
      <p>Dear student,</p>
      <p>Your ${purpose} verification code for the Victoria University Online Voting System is:</p>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;"><strong>${otp}</strong></p>
      <p>This code is valid for 10 minutes. Please do not share it with anyone.</p>
      ${signature}
    `,
  }),
  registrationWelcome: (name) => ({
    subject: 'Your VU Online Voting account has been verified',
    html: `<p>Dear ${name},</p><p>Your Victoria University Online Voting account has been verified successfully. You may now participate in eligible campus elections.</p>${signature}`,
  }),
  applicationSubmitted: (election, position) => ({
    subject: 'Candidate application received',
    html: `<p>Dear student,</p><p>Your candidate application for <strong>${position}</strong> in <strong>${election}</strong> has been received and is pending administrative review.</p>${signature}`,
  }),
  applicationApproved: (election, position) => ({
    subject: 'Candidate application approved',
    html: `<p>Dear student,</p><p>Your candidate application for <strong>${position}</strong> in <strong>${election}</strong> has been approved.</p>${signature}`,
  }),
  applicationRejected: (election, position, reason) => ({
    subject: 'Candidate application outcome',
    html: `<p>Dear student,</p><p>Your candidate application for <strong>${position}</strong> in <strong>${election}</strong> was not approved.${reason ? ` Reason: ${reason}` : ''}</p>${signature}`,
  }),
  voteConfirmation: (election, receipt) => ({
    subject: 'Vote submission confirmation',
    html: `<p>Dear student,</p><p>Your vote in <strong>${election}</strong> has been recorded successfully.</p><p>Receipt: <strong>${receipt}</strong></p><p>Please keep this receipt for your records.</p>${signature}`,
  }),
  resultsAvailable: (election) => ({
    subject: 'Official election results published',
    html: `<p>Dear student,</p><p>Official results for <strong>${election}</strong> are now available on the Victoria University Online Voting portal.</p>${signature}`,
  }),
  electionReminder: (election, closesAt) => ({
    subject: `Reminder: ${election} closes soon`,
    html: `<p>Dear student,</p><p>Voting for <strong>${election}</strong> closes at ${closesAt}. Please cast your vote before the closing time if you have not already done so.</p>${signature}`,
  }),
  announcement: (title, body) => ({
    subject: `Election services announcement: ${title}`,
    html: `<p>Dear student,</p><p>${body}</p>${signature}`,
  }),
  passwordReset: (otp, name) => ({
    subject: 'Victoria University — Password reset code',
    html: `
      <p>Dear ${name},</p>
      <p>You requested a password reset for your Victoria University Online Voting account.</p>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;"><strong>${otp}</strong></p>
      <p>Enter this code on the reset page within 15 minutes. If you did not request this, ignore this email.</p>
      ${signature}
    `,
  }),
  passwordResetComplete: (name) => ({
    subject: 'Your Victoria University password was changed',
    html: `<p>Dear ${name},</p><p>Your Victoria University Online Voting account password was changed successfully. If you did not make this change, contact the elections office immediately.</p>${signature}`,
  }),
  passwordChanged: (name) => ({
    subject: 'Your Victoria University password was updated',
    html: `<p>Dear ${name},</p><p>Your Victoria University Online Voting account password was updated from your profile settings. If you did not make this change, contact the elections office immediately.</p>${signature}`,
  }),
  accountLocked: (name, minutes) => ({
    subject: 'Security alert — account temporarily locked',
    html: `<p>Dear ${name},</p><p>Your Victoria University Online Voting account was temporarily locked after multiple failed verification attempts. Try again in ${minutes} minutes or contact the elections office if you need assistance.</p>${signature}`,
  }),
  loginAlert: (name, ipAddress) => ({
    subject: 'New sign-in to your Victoria University voting account',
    html: `<p>Dear ${name},</p><p>Your account was signed in successfully${ipAddress ? ` from IP ${ipAddress}` : ''}. If this was not you, reset your password and contact the elections office.</p>${signature}`,
  }),
  electionPublished: (election, startTime, endTime) => ({
    subject: `Election open: ${election}`,
    html: `<p>Dear student,</p><p><strong>${election}</strong> is now published on the Victoria University Online Voting portal.</p><p>Voting window: ${startTime} to ${endTime}.</p><p>Sign in to view your ballot and cast your vote when voting opens.</p>${signature}`,
  }),
  adminNewApplication: (applicantName, studentId, election, position) => ({
    subject: 'New candidate application pending review',
    html: `<p>Dear administrator,</p><p><strong>${applicantName}</strong> (${studentId}) applied for <strong>${position}</strong> in <strong>${election}</strong>. Please review the application in the admin dashboard.</p>${signature}`,
  }),
  anomalyAlert: (voterName, studentId, election, score) => ({
    subject: 'Selfie verification anomaly — review required',
    html: `<p>Dear administrator,</p><p>A vote by <strong>${voterName}</strong> (${studentId}) in <strong>${election}</strong> was flagged for selfie verification review (match score: ${score}). Please review the anomaly queue in the admin dashboard.</p>${signature}`,
  }),
};

async function sendTemplate(to, templateKey, ...args) {
  const tpl = templates[templateKey](...args);
  return sendEmail({ to, ...tpl });
}

module.exports = { sendEmail, sendTemplate, templates };
