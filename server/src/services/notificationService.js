const User = require('../models/User');
const Election = require('../models/Election');
const Position = require('../models/Position');
const Vote = require('../models/Vote');
const CandidateApplication = require('../models/CandidateApplication');
const AnomalyReview = require('../models/AnomalyReview');
const { userMeetsEligibility } = require('./eligibilityService');

const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const VOTE_CONFIRM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isVotingOpen(election, now = new Date()) {
  return ['published', 'active'].includes(election.status)
    && now >= election.startTime
    && now <= election.endTime;
}

function isUpcoming(election, now = new Date()) {
  return ['published', 'active'].includes(election.status)
    && election.startTime > now
    && election.startTime - now <= UPCOMING_WINDOW_MS;
}

function formatWhen(date) {
  return new Date(date).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
}

async function getVoterNotifications(user) {
  const notifications = [];
  const now = new Date();

  if (!user.isVerified) {
    notifications.push({
      id: 'verification-pending',
      type: 'verification',
      title: 'Verify your account',
      message: 'Complete email verification to vote and apply as a candidate on the website.',
      link: '/profile',
      createdAt: user.createdAt || now,
      priority: 'high',
    });
  }

  const applications = await CandidateApplication.find({ applicantId: user._id })
    .populate('electionId', 'title')
    .populate('positionId', 'title')
    .sort({ updatedAt: -1 });

  for (const application of applications) {
    const electionTitle = application.electionId?.title || 'an election';
    const positionTitle = application.positionId?.title || 'a position';
    const base = {
      createdAt: application.reviewedAt || application.updatedAt || application.createdAt,
      link: '/apply',
    };

    if (application.status === 'pending') {
      notifications.push({
        ...base,
        id: `application-pending-${application._id}`,
        type: 'application',
        title: 'Application under review',
        message: `Your candidacy application for ${positionTitle} in ${electionTitle} is pending admin review.`,
        priority: 'normal',
      });
    } else if (application.status === 'approved') {
      notifications.push({
        ...base,
        id: `application-approved-${application._id}`,
        type: 'application',
        title: 'Application approved',
        message: `You are approved to run for ${positionTitle} in ${electionTitle}.`,
        priority: 'normal',
      });
    } else if (application.status === 'rejected') {
      const reason = application.rejectionReason
        ? ` Reason: ${application.rejectionReason}`
        : '';
      notifications.push({
        ...base,
        id: `application-rejected-${application._id}`,
        type: 'application',
        title: 'Application not approved',
        message: `Your application for ${positionTitle} in ${electionTitle} was not approved.${reason}`,
        priority: 'high',
      });
    }
  }

  const elections = await Election.find({ status: { $ne: 'draft' } }).sort({ startTime: -1 });
  const votes = await Vote.find({ userId: user._id });
  const votedElectionIds = new Set(votes.map((v) => v.electionId.toString()));
  const electionMap = Object.fromEntries(elections.map((e) => [e._id.toString(), e]));

  for (const election of elections) {
    if (isUpcoming(election, now)) {
      notifications.push({
        id: `election-upcoming-${election._id}`,
        type: 'election',
        title: 'Election opening soon',
        message: `${election.title} opens on ${formatWhen(election.startTime)}.`,
        link: '/dashboard',
        createdAt: election.updatedAt || election.createdAt,
        priority: 'normal',
      });
    }

    if (isVotingOpen(election, now) && !votedElectionIds.has(election._id.toString())) {
      const positions = await Position.find({ electionId: election._id });
      const hasEligible = positions.some(
        (p) => userMeetsEligibility(user, p.eligibility).eligible
      );
      if (hasEligible) {
        notifications.push({
          id: `vote-reminder-${election._id}`,
          type: 'vote',
          title: 'Your ballot is ready',
          message: `Voting is open for ${election.title}. Cast your vote before ${formatWhen(election.endTime)}.`,
          link: `/vote/${election._id}`,
          createdAt: election.startTime,
          priority: 'high',
        });
      }
    }

    if (['closed', 'certified'].includes(election.status)
      && votedElectionIds.has(election._id.toString())) {
      notifications.push({
        id: `results-available-${election._id}`,
        type: 'results',
        title: 'Results available',
        message: `${election.title} has ended. View the certified results on the website.`,
        link: `/live/${election._id}`,
        createdAt: election.closedAt || election.updatedAt || election.endTime,
        priority: 'normal',
      });
    }
  }

  const recentByElection = {};
  for (const vote of votes) {
    const castAt = vote.castAt || vote.createdAt;
    if (now - new Date(castAt) > VOTE_CONFIRM_WINDOW_MS) continue;
    const electionId = vote.electionId.toString();
    if (!recentByElection[electionId] || new Date(castAt) > new Date(recentByElection[electionId].castAt)) {
      recentByElection[electionId] = { ...vote.toObject(), castAt };
    }
  }

  for (const [electionId, vote] of Object.entries(recentByElection)) {
    const election = electionMap[electionId];
    if (!election) continue;
    const receiptHint = vote.receiptToken
      ? `${vote.receiptToken.slice(0, 8)}…`
      : 'on file';
    notifications.push({
      id: `vote-confirmed-${electionId}`,
      type: 'vote',
      title: 'Vote recorded',
      message: `Your vote in ${election.title} was recorded. Receipt: ${receiptHint}`,
      link: '/my-ballots',
      createdAt: vote.castAt,
      priority: 'normal',
    });
  }

  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getAdminNotifications() {
  const notifications = [];
  const now = new Date();

  const [pendingApps, pendingAnomalies, activeElections, unverifiedCount] = await Promise.all([
    CandidateApplication.countDocuments({ status: 'pending' }),
    AnomalyReview.countDocuments({ status: 'pending' }),
    Election.find({ status: 'active' }).sort({ endTime: 1 }),
    User.countDocuments({ role: 'voter', isVerified: false }),
  ]);

  if (pendingApps > 0) {
    notifications.push({
      id: 'admin-pending-applications',
      type: 'admin',
      title: 'Candidate applications awaiting review',
      message: `${pendingApps} application${pendingApps === 1 ? '' : 's'} need your review on the website.`,
      link: '/admin?tab=applications',
      createdAt: now,
      priority: 'high',
    });
  }

  if (pendingAnomalies > 0) {
    notifications.push({
      id: 'admin-pending-anomalies',
      type: 'admin',
      title: 'Face verification anomalies',
      message: `${pendingAnomalies} vote${pendingAnomalies === 1 ? '' : 's'} flagged for review.`,
      link: '/admin?tab=audit',
      createdAt: now,
      priority: 'high',
    });
  }

  for (const election of activeElections) {
    notifications.push({
      id: `admin-active-election-${election._id}`,
      type: 'election',
      title: 'Election in progress',
      message: `${election.title} is active until ${formatWhen(election.endTime)}.`,
      link: '/admin?tab=elections',
      createdAt: election.startTime,
      priority: 'normal',
    });
  }

  if (unverifiedCount > 0) {
    notifications.push({
      id: 'admin-unverified-users',
      type: 'admin',
      title: 'Unverified student accounts',
      message: `${unverifiedCount} student${unverifiedCount === 1 ? '' : 's'} still need email verification.`,
      link: '/admin',
      createdAt: now,
      priority: 'normal',
    });
  }

  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getNotificationsForUser(user) {
  if (user.role === 'admin') {
    return getAdminNotifications();
  }
  return getVoterNotifications(user);
}

module.exports = {
  getNotificationsForUser,
  getVoterNotifications,
  getAdminNotifications,
  isVotingOpen,
  isUpcoming,
};
