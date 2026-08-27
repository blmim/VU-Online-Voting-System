const cron = require('node-cron');
const Election = require('../models/Election');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { certifyElectionResults } = require('../services/resultsService');
const { sendTemplate } = require('../services/emailService');
const { getVerifiedVoterEmails } = require('../utils/emailRecipients');
const AuditLog = require('../models/AuditLog');

const REMINDER_HOURS_BEFORE_CLOSE = 24;

function startElectionCron(io) {
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    await Election.updateMany(
      { status: 'published', startTime: { $lte: now }, endTime: { $gt: now } },
      { status: 'active' }
    );

    const reminderWindow = new Date(now.getTime() + REMINDER_HOURS_BEFORE_CLOSE * 60 * 60 * 1000);
    const electionsNeedingReminder = await Election.find({
      status: 'active',
      endTime: { $gt: now, $lte: reminderWindow },
      reminderSentAt: { $in: [null, undefined] },
    });

    for (const election of electionsNeedingReminder) {
      try {
        const closesAt = election.endTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
        const votedUserIds = new Set(
          (await Vote.distinct('userId', { electionId: election._id })).map((id) => id.toString())
        );
        const voters = await User.find({ role: 'voter', isVerified: true });
        const recipients = voters.filter((v) => !votedUserIds.has(v._id.toString()));

        for (const voter of recipients) {
          try {
            await sendTemplate(voter.email, 'electionReminder', election.title, closesAt);
          } catch (err) {
            console.error(`Reminder email failed for ${voter.email}:`, err.message);
          }
        }

        election.reminderSentAt = now;
        await election.save();

        await AuditLog.appendLog({
          event: 'ELECTION_REMINDER_SENT',
          electionId: election._id,
          metadata: { recipientCount: recipients.length, closesAt },
        });
      } catch (err) {
        console.error('Election reminder error:', err.message);
      }
    }

    const closing = await Election.find({
      status: 'active',
      endTime: { $lte: now },
    });

    for (const election of closing) {
      try {
        election.status = 'closed';
        election.closedAt = now;
        await election.save();

        await certifyElectionResults(election._id);

        const voterEmails = await getVerifiedVoterEmails();
        for (const email of voterEmails) {
          try {
            await sendTemplate(email, 'resultsAvailable', election.title);
          } catch (err) {
            console.error(`Results email failed for ${email}:`, err.message);
          }
        }

        await AuditLog.appendLog({
          event: 'ELECTION_CERTIFIED',
          electionId: election._id,
          metadata: { title: election.title, resultsEmailsSent: voterEmails.length },
        });

        if (io) io.emit('election:certified', { electionId: election._id });
      } catch (err) {
        console.error('Certification error:', err.message);
      }
    }
  });
}

module.exports = { startElectionCron };
