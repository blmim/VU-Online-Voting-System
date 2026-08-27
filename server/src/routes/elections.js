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

const router = express.Router();

router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let elections;
    if (q) {
      elections = await Election.find(
        { ...filter, $text: { $search: q } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);

      if (elections.length === 0) {
        const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
        elections = await Election.find({
          ...filter,
          $or: [{ title: regex }, { description: regex }],
        })
          .sort({ startTime: -1 })
          .limit(50);
      }
    } else {
      elections = await Election.find(Object.keys(filter).length ? filter : {})
        .sort({ startTime: -1 })
        .limit(50);
    }

    res.json({ elections });
  } catch (err) {
    console.error('Election search error:', err.message);
    res.status(500).json({ error: 'Failed to search elections' });
  }
});

router.get('/public', async (req, res) => {
  const elections = await Election.find({
    status: { $in: ['published', 'active', 'closed', 'certified'] },
  }).sort({ startTime: -1 });
  res.json({ elections });
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
  const candidates = await Candidate.find({ electionId: election._id, isActive: true });
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
  const candidates = await Candidate.find({
    electionId: election._id,
    positionId: { $in: eligiblePositions.map((p) => p._id) },
    isActive: true,
  });

  const existingVotes = await Vote.find({ userId: req.user._id, electionId: election._id });
  const votedPositionIds = existingVotes.map((v) => v.positionId.toString());

  res.json({
    election,
    positions: eligiblePositions,
    candidates,
    votedPositionIds,
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
