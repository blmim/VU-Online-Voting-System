const express = require('express');
const { body } = require('express-validator');
const Election = require('../models/Election');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { authenticate, requireAdmin, requireVerified } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { filterEligiblePositions, userMeetsEligibility } = require('../services/eligibilityService');
const AuditLog = require('../models/AuditLog');
const { sendTemplate } = require('../services/emailService');
const { getEligibleVoterEmailsForElection, getVerifiedVoterEmails } = require('../utils/emailRecipients');
const { certifyElectionResults } = require('../services/resultsService');
const { escapeRegex } = require('../utils/escapeRegex');
const { enrichCandidates } = require('../utils/candidateEnrichment');
const { dedupeCandidates, groupCandidatesByUser } = require('../utils/dedupeCandidates');
const { searchElections, filterElectionsByPhase, findCandidateMatches } = require('../utils/electionSearch');
const Announcement = require('../models/Announcement');
const PollVote = require('../models/PollVote');
const PredictionPoll = require('../models/PredictionPoll');
const ElectionDiscussion = require('../models/ElectionDiscussion');
const PollComment = require('../models/PollComment');
const { buildFeedbackAnalysis } = require('../services/feedbackAnalysisService');
const { emitSocketNotification } = require('../utils/socketNotify');

const router = express.Router();

router.get('/home/public', async (req, res) => {
  try {
    const elections = await Election.find({
      status: { $in: ['published', 'active', 'closed', 'certified'] },
    }).sort({ startTime: -1 }).limit(20);

    const now = Date.now();
    const active = [];
    const upcoming = [];
    const finished = [];

    for (const e of elections) {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime).getTime();
      if (['closed', 'certified'].includes(e.status) || end < now) finished.push(e);
      else if (start > now) upcoming.push(e);
      else if (['published', 'active'].includes(e.status)) active.push(e);
      else finished.push(e);
    }

    const featuredElection = active[0] || upcoming[0] || finished[0];
    let featuredCandidates = [];
    let turnout = { votesCast: 0, eligibleVoters: 0, turnoutPct: 0 };

    if (featuredElection) {
      const raw = dedupeCandidates(
        await Candidate.find({ electionId: featuredElection._id, isActive: true }).limit(24)
      );
      const enriched = await enrichCandidates(raw);
      featuredCandidates = groupCandidatesByUser(enriched).slice(0, 6);

      const votesCast = await Vote.distinct('userId', { electionId: featuredElection._id });
      const eligibleVoters = featuredElection.totalEligibleVoters
        || await User.countDocuments({ role: 'voter', isVerified: true });
      turnout = {
        votesCast: votesCast.length,
        eligibleVoters,
        turnoutPct: eligibleVoters > 0
          ? Math.round((votesCast.length / eligibleVoters) * 1000) / 10
          : 0,
      };
    }

    const [announcement, pollStats, totalVoters] = await Promise.all([
      Announcement.findOne().sort({ sentAt: -1 }).select('title body sentAt'),
      PollVote.countDocuments(),
      User.countDocuments({ role: 'voter', isVerified: true }),
    ]);

    res.json({
      stats: {
        activeCount: active.length,
        upcomingCount: upcoming.length,
        finishedCount: finished.length,
        totalVoters,
        pollResponses: pollStats,
        activePolls: await PredictionPoll.countDocuments({ status: 'active' }),
      },
      active,
      upcoming,
      finished,
      featuredCandidates,
      featuredElection,
      turnout,
      announcement,
    });
  } catch (err) {
    console.error('Home public error:', err.message);
    res.status(500).json({ error: 'Failed to load home data' });
  }
});

router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, status, phase } = req.query;
    const includeDraft = req.user.role === 'admin' && !status;

    let result;
    if (status) {
      const filter = { status };
      let elections = await Election.find(filter).sort({ startTime: -1 }).limit(50);
      if (q) {
        const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
        elections = elections.filter(
          (e) => regex.test(e.title) || regex.test(e.description || '')
        );
      }
      elections = filterElectionsByPhase(elections, phase);
      const candidateMatches = await findCandidateMatches(q, phase);
      result = { elections, candidateMatches, query: q || '' };
    } else {
      result = await searchElections({ q, phase, includeDraft });
      if (!includeDraft) {
        result.elections = result.elections.filter((e) => e.status !== 'draft');
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Election search error:', err.message);
    res.status(500).json({ error: 'Failed to search elections' });
  }
});

router.get('/public/search', async (req, res) => {
  try {
    const { q, phase } = req.query;
    const result = await searchElections({ q, phase, includeDraft: false });
    res.json(result);
  } catch (err) {
    console.error('Public election search error:', err.message);
    res.status(500).json({ error: 'Failed to search elections' });
  }
});

router.get('/public', async (req, res) => {
  const elections = await Election.find({
    status: { $in: ['published', 'active', 'closed', 'certified'] },
  }).sort({ startTime: -1 });
  res.json({ elections });
});

function buildDiscussionTree(comments) {
  const map = new Map();
  const roots = [];
  for (const c of comments) {
    map.set(String(c._id), { ...c.toObject?.() ?? c, replies: [] });
  }
  for (const c of map.values()) {
    if (c.parentId) {
      const parent = map.get(String(c.parentId));
      if (parent) parent.replies.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

router.get('/:id/public', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election || election.status === 'draft') {
      return res.status(404).json({ error: 'Election not found' });
    }
    const positions = await Position.find({ electionId: election._id }).sort({ order: 1 });
    const polls = await PredictionPoll.find({ electionId: election._id, status: { $ne: 'draft' } })
      .select('title status closesAt')
      .sort({ createdAt: -1 });
    res.json({ election, positions, polls });
  } catch (err) {
    console.error('Public election error:', err.message);
    res.status(500).json({ error: 'Failed to load election' });
  }
});

router.get('/:id/candidates', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election || election.status === 'draft') {
      return res.status(404).json({ error: 'Election not found' });
    }
    const raw = dedupeCandidates(
      await Candidate.find({ electionId: election._id, isActive: true })
    );
    const candidates = await enrichCandidates(raw);
    const groupedCandidates = groupCandidatesByUser(candidates);
    const positions = await Position.find({ electionId: election._id }).sort({ order: 1 });
    res.json({
      election: { _id: election._id, title: election.title },
      positions,
      candidates,
      groupedCandidates,
    });
  } catch (err) {
    console.error('Election candidates error:', err.message);
    res.status(500).json({ error: 'Failed to load candidates' });
  }
});

router.get('/:id/discussion', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election || election.status === 'draft') {
      return res.status(404).json({ error: 'Election not found' });
    }
    const comments = await ElectionDiscussion.find({ electionId: election._id })
      .sort({ createdAt: 1 })
      .limit(500);
    res.json({ comments: buildDiscussionTree(comments), total: comments.length });
  } catch (err) {
    console.error('Discussion load error:', err.message);
    res.status(500).json({ error: 'Failed to load discussion' });
  }
});

router.post(
  '/:id/discussion',
  authenticate,
  [body('body').notEmpty().isLength({ max: 2000 }), body('parentId').optional().isMongoId()],
  handleValidation,
  async (req, res) => {
    try {
      const election = await Election.findById(req.params.id);
      if (!election || election.status === 'draft') {
        return res.status(404).json({ error: 'Election not found' });
      }
      const comment = await ElectionDiscussion.create({
        electionId: election._id,
        userId: req.user._id,
        authorName: req.user.fullName,
        body: req.body.body,
        parentId: req.body.parentId || null,
      });
      emitSocketNotification(req, {
        id: `discussion-${comment._id}`,
        type: 'election',
        title: 'New discussion post',
        message: `${req.user.fullName} posted in ${election.title} discussion.`,
        link: `/elections/${election._id}?tab=discussion`,
      });
      res.status(201).json({ comment });
    } catch (err) {
      console.error('Discussion post error:', err.message);
      res.status(500).json({ error: 'Failed to post comment' });
    }
  }
);

router.get('/:id/insights', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election || election.status === 'draft') {
      return res.status(404).json({ error: 'Election not found' });
    }

    const rawCandidates = dedupeCandidates(
      await Candidate.find({ electionId: election._id, isActive: true })
    );
    const candidates = await enrichCandidates(rawCandidates);

    const discussionComments = await ElectionDiscussion.find({ electionId: election._id }).select('body');
    const polls = await PredictionPoll.find({ electionId: election._id }).select('_id');
    const pollIds = polls.map((p) => p._id);
    const pollComments = pollIds.length
      ? await PollComment.find({ pollId: { $in: pollIds } }).select('content')
      : [];

    const analysis = buildFeedbackAnalysis({ candidates, discussionComments, pollComments });
    res.json({ election: { _id: election._id, title: election.title }, analysis });
  } catch (err) {
    console.error('Insights error:', err.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { status: { $ne: 'draft' } };
  const elections = await Election.find(filter).sort({ startTime: -1 });
  res.json({ elections });
});

router.get('/:id', authenticate, async (req, res) => {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ error: 'Not found' });

  const positions = await Position.find({ electionId: election._id }).sort({ order: 1 });
  const candidates = await enrichCandidates(
    dedupeCandidates(
      await Candidate.find({ electionId: election._id, isActive: true })
    )
  );
  const userVotes = await Vote.find({ userId: req.user._id, electionId: election._id });

  const positionsWithEligibility = filterEligiblePositions(req.user, positions);

  res.json({
    election,
    positions: positionsWithEligibility,
    candidates,
    hasVoted: userVotes.length > 0,
    votedPositions: userVotes.map((v) => v.positionId),
  });
});

router.get('/:id/ballot', authenticate, requireVerified, async (req, res) => {
  const election = await Election.findById(req.params.id);
  if (!election || !['published', 'active'].includes(election.status)) {
    return res.status(400).json({ error: 'Election not available for voting' });
  }

  const now = new Date();
  if (now < election.startTime || now > election.endTime) {
    return res.status(400).json({ error: 'Outside voting window' });
  }

  const positions = await Position.find({ electionId: election._id }).sort({ order: 1 });
  const eligiblePositions = positions.filter((p) => userMeetsEligibility(req.user, p.eligibility).eligible);

  const myCandidateRows = await Candidate.find({
    electionId: election._id,
    userId: req.user._id,
    isActive: true,
  });
  const myCandidatePositionIds = new Set(myCandidateRows.map((c) => String(c.positionId)));

  const votablePositions = eligiblePositions.filter(
    (p) => !myCandidatePositionIds.has(String(p._id))
  );

  const candidates = await enrichCandidates(
    dedupeCandidates(
      await Candidate.find({
        electionId: election._id,
        positionId: { $in: votablePositions.map((p) => p._id) },
        isActive: true,
      })
    )
  );

  const existingVotes = await Vote.find({ userId: req.user._id, electionId: election._id });
  const votedPositionIds = existingVotes.map((v) => v.positionId.toString());

  res.json({
    election,
    positions: eligiblePositions,
    votablePositions,
    candidatePositions: eligiblePositions.filter((p) => myCandidatePositionIds.has(String(p._id))),
    candidates,
    votedPositionIds,
    isCandidateInElection: myCandidateRows.length > 0,
  });
});

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const totalEligible = await User.countDocuments({ role: 'voter', isVerified: true });
      const election = await Election.create({
        ...req.body,
        createdBy: req.user._id,
        totalEligibleVoters: totalEligible,
        settings: {
          // New elections default private; admin must opt in to public live results
          showLiveResultsPublic: req.body.settings?.showLiveResultsPublic ?? false,
          requireSelfieVerification: req.body.settings?.requireSelfieVerification ?? true,
          sendVoteConfirmationEmail: req.body.settings?.sendVoteConfirmationEmail ?? true,
        },
      });

      await AuditLog.appendLog({
        event: 'ELECTION_CREATED',
        userId: req.user._id,
        electionId: election._id,
        ipAddress: req.ip,
      });

      res.status(201).json({ election });
    } catch (err) {
      console.error('Election create error:', err.message);
      res.status(500).json({ error: 'Failed to create election' });
    }
  }
);

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const existing = await Election.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const allowed = {};
  if (req.body.settings) {
    const current = existing.settings?.toObject?.() ?? existing.settings ?? {};
    allowed.settings = {
      showLiveResultsPublic: current.showLiveResultsPublic ?? false,
      requireSelfieVerification: current.requireSelfieVerification ?? true,
      sendVoteConfirmationEmail: current.sendVoteConfirmationEmail ?? true,
      ...req.body.settings,
    };
  }
  if (req.body.title) allowed.title = req.body.title;
  if (req.body.description !== undefined) allowed.description = req.body.description;
  if (req.body.startTime) allowed.startTime = req.body.startTime;
  if (req.body.endTime) allowed.endTime = req.body.endTime;

  const election = await Election.findByIdAndUpdate(req.params.id, allowed, { new: true });
  await AuditLog.appendLog({ event: 'ELECTION_UPDATED', userId: req.user._id, electionId: election._id });
  res.json({ election });
});

router.post('/:id/close', authenticate, requireAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ error: 'Not found' });
    if (!['published', 'active'].includes(election.status)) {
      return res.status(400).json({ error: 'Only published or active elections can be closed' });
    }

    election.status = 'closed';
    election.closedAt = new Date();
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
      event: 'ELECTION_CLOSED_MANUAL',
      userId: req.user._id,
      electionId: election._id,
      metadata: { title: election.title },
    });

    res.json({
      election,
      message: 'Election closed, results certified, and export files generated',
    });
  } catch (err) {
    console.error('Election close error:', err.message);
    res.status(500).json({ error: 'Failed to close election' });
  }
});

router.post('/:id/publish', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findByIdAndUpdate(
    req.params.id,
    { status: 'published' },
    { new: true }
  );
  if (!election) return res.status(404).json({ error: 'Not found' });

  const startTime = election.startTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
  const endTime = election.endTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
  const recipients = await getEligibleVoterEmailsForElection(election._id);
  for (const email of recipients) {
    try {
      await sendTemplate(email, 'electionPublished', election.title, startTime, endTime);
    } catch (err) {
      console.error(`Election publish email failed for ${email}:`, err.message);
    }
  }

  await AuditLog.appendLog({
    event: 'ELECTION_PUBLISHED',
    userId: req.user._id,
    electionId: election._id,
    metadata: { recipientCount: recipients.length },
  });

  res.json({ election, emailsSent: recipients.length });
});

router.post('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
  res.json({ election });
});

router.post(
  '/:id/positions',
  authenticate,
  requireAdmin,
  [body('title').notEmpty(), body('seats').optional().isInt({ min: 1 })],
  handleValidation,
  async (req, res) => {
    const position = await Position.create({
      electionId: req.params.id,
      title: req.body.title,
      description: req.body.description || '',
      seats: req.body.seats || 1,
      order: req.body.order || 0,
      eligibility: req.body.eligibility || {},
    });
    res.status(201).json({ position });
  }
);

router.put('/:electionId/positions/:positionId', authenticate, requireAdmin, async (req, res) => {
  const allowed = {};
  if (req.body.title !== undefined) allowed.title = req.body.title;
  if (req.body.description !== undefined) allowed.description = req.body.description;
  if (req.body.seats !== undefined) allowed.seats = req.body.seats;
  if (req.body.order !== undefined) allowed.order = req.body.order;
  if (req.body.eligibility !== undefined) allowed.eligibility = req.body.eligibility;

  const position = await Position.findOneAndUpdate(
    { _id: req.params.positionId, electionId: req.params.electionId },
    allowed,
    { new: true }
  );
  if (!position) return res.status(404).json({ error: 'Position not found' });
  res.json({ position });
});

module.exports = router;
