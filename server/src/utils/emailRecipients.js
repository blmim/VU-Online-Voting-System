const User = require('../models/User');
const Position = require('../models/Position');
const { userMeetsEligibility } = require('../services/eligibilityService');

async function getAdminEmails() {
  const admins = await User.find({ role: 'admin' }).select('email');
  return admins.map((a) => a.email);
}

async function getVerifiedVoterEmails() {
  const voters = await User.find({ role: 'voter', isVerified: true }).select('email');
  return voters.map((v) => v.email);
}

async function getEligibleVoterEmailsForElection(electionId) {
  const [voters, positions] = await Promise.all([
    User.find({ role: 'voter', isVerified: true }),
    Position.find({ electionId }),
  ]);

  if (positions.length === 0) {
    return voters.map((v) => v.email);
  }

  return voters
    .filter((voter) =>
      positions.some((pos) => userMeetsEligibility(voter, pos.eligibility).eligible)
    )
    .map((v) => v.email);
}

async function notifyAdmins(sendFn) {
  const emails = await getAdminEmails();
  for (const email of emails) {
    await sendFn(email);
  }
}

module.exports = {
  getAdminEmails,
  getVerifiedVoterEmails,
  getEligibleVoterEmailsForElection,
  notifyAdmins,
};
