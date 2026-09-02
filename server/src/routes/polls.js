const express = require('express');
const crypto = require('crypto');
const { body } = require('express-validator');
const PredictionPoll = require('../models/PredictionPoll');
const PollVote = require('../models/PollVote');
const PollComment = require('../models/PollComment');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { enrichCandidates } = require('../utils/candidateEnrichment');
const { groupCandidatesByUser } = require('../utils/dedupeCandidates');
const { buildAnalysis } = require('../services/pollAnalysisService');
const { emitSocketNotification } = require('../utils/socketNotify');

const router = express.Router();

function voterKey(req, res) {
  if (req.user) return `user:${req.user._id}`;
  const cookieKey = req.cookies?.pollVoterKey;
  if (cookieKey) return cookieKey;
  const generated = `anon:${crypto.randomBytes(16).toString('hex')}`;
  res.cookie('pollVoterKey', generated, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  return generated;
}

function ipHash(req) {
  return crypto.createHash('sha256').update(String(req.ip || '')).digest('hex').slice(0, 16);
}

async function loadPollWithData(pollId, req) {
  const poll = await PredictionPoll.findById(pollId).populate('electionId', 'title status');
  if (!poll) return null;

  const votes = await PollVote.find({ pollId: poll._id });
  const comments = await PollComment.find({ pollId: poll._id, isReported: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(200);

  const key = req.user ? `user:${req.user._id}` : req.cookies?.pollVoterKey;
  const userVote = req.user
    ? votes.find((v) => String(v.userId) === String(req.user._id) || v.voterKey === key)
    : null;
  const analysis = buildAnalysis(poll, votes, comments);

  return { poll, votes, comments, userVote, analysis };
}

router.get('/stats', async (req, res) => {
  try {
    const [activePolls, totalResponses] = await Promise.all([
      PredictionPoll.countDocuments({ status: 'active' }),
      PollVote.countDocuments(),
    ]);
    res.json({ activePolls, totalResponses });
  } catch (err) {
    console.error('Poll stats error:', err.message);
    res.status(500).json({ error: 'Failed to load poll stats' });
  }
});

router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const polls = await PredictionPoll.find(filter)
      .sort({ createdAt: -1 })
      .populate('electionId', 'title');

    const enriched = await Promise.all(
      polls.map(async (poll) => {
        const votes = await PollVote.find({ pollId: poll._id });
        const analysis = buildAnalysis(poll, votes, []);
        return {
          ...poll.toObject(),
          totalVotes: analysis.totalVotes,
          leader: analysis.leader,
        };
      })
    );

    res.json({ polls: enriched });
  } catch (err) {
    console.error('Poll list error:', err.message);
    res.status(500).json({ error: 'Failed to load polls' });
  }
});

router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const data = await loadPollWithData(req.params.id, req);
    if (!data) return res.status(404).json({ error: 'Poll not found' });

    const threaded = data.comments.filter((c) => !c.parentId);
    const replies = data.comments.filter((c) => c.parentId);

    res.json({
      poll: data.poll,
      analysis: data.analysis,
      hasVoted: Boolean(data.userVote),
      userVoteOptionId: data.userVote?.optionId,
      comments: threaded.map((c) => ({
        ...c.toObject(),
        replies: replies.filter((r) => String(r.parentId) === String(c._id)),
      })),
    });
  } catch (err) {
    console.error('Poll detail error:', err.message);
    res.status(500).json({ error: 'Failed to load poll' });
  }
});

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().trim(),
    body('options').isArray({ min: 2 }),
    body('options.*.displayName').notEmpty(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const poll = await PredictionPoll.create({
        title: req.body.title,
        description: req.body.description || '',
        electionId: req.body.electionId || undefined,
        options: req.body.options,
        closesAt: req.body.closesAt || undefined,
        createdBy: req.user._id,
      });
      res.status(201).json({ poll });
    } catch (err) {
      console.error('Poll create error:', err.message);
      res.status(500).json({ error: 'Failed to create poll' });
    }
  }
);

router.post('/from-election/:electionId', authenticate, requireAdmin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ error: 'Election not found' });

    const raw = await Candidate.find({ electionId: election._id, isActive: true });
    const candidates = groupCandidatesByUser(await enrichCandidates(raw));
    if (candidates.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 candidates to create a prediction poll' });
    }

    const poll = await PredictionPoll.create({
      title: req.body.title || `Who will win: ${election.title}?`,
      description: req.body.description || `Public opinion poll for ${election.title}. This is NOT an official vote.`,
      electionId: election._id,
      options: candidates.map((c) => ({
        candidateId: c.candidateId || c._id,
        displayName: c.displayName,
        photoUrl: c.photoUrl || '',
        manifesto: c.manifesto || '',
        positions: c.positions || [],
      })),
      closesAt: election.endTime,
      createdBy: req.user._id,
    });

    res.status(201).json({ poll });
  } catch (err) {
    console.error('Poll from election error:', err.message);
    res.status(500).json({ error: 'Failed to create poll from election' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const allowed = {};
  if (req.body.title) allowed.title = req.body.title;
  if (req.body.description !== undefined) allowed.description = req.body.description;
  if (req.body.status) allowed.status = req.body.status;
  if (req.body.closesAt !== undefined) allowed.closesAt = req.body.closesAt;

  const poll = await PredictionPoll.findByIdAndUpdate(req.params.id, allowed, { new: true });
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json({ poll });
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const poll = await PredictionPoll.findByIdAndDelete(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  await PollVote.deleteMany({ pollId: poll._id });
  await PollComment.deleteMany({ pollId: poll._id });
  res.json({ message: 'Poll deleted' });
});

function resolveOptionId(poll, body) {
  if (body.optionId) {
    const opt = poll.options.find((o) => String(o._id) === String(body.optionId));
    return opt ? opt._id : null;
  }
  if (body.candidateId) {
    const opt = poll.options.find((o) => o.candidateId && String(o.candidateId) === String(body.candidateId));
    return opt ? opt._id : null;
  }
  if (body.optionIndex !== undefined && body.optionIndex !== null) {
    const idx = Number(body.optionIndex);
    if (Number.isInteger(idx) && idx >= 0 && idx < poll.options.length) {
      return poll.options[idx]._id;
    }
  }
  return null;
}

router.post(
  '/:id/vote',
  authenticate,
  handleValidation,
  async (req, res) => {
    try {
      const poll = await PredictionPoll.findById(req.params.id);
      if (!poll || poll.status !== 'active') {
        return res.status(400).json({ error: 'Poll is not open for voting' });
      }
      if (poll.closesAt && new Date(poll.closesAt) < new Date()) {
        return res.status(400).json({ error: 'Poll has closed' });
      }

      const optionId = resolveOptionId(poll, req.body);
      if (!optionId) return res.status(400).json({ error: 'Invalid option — provide optionId, candidateId, or optionIndex' });

      const key = `user:${req.user._id}`;
      const existing = await PollVote.findOne({ pollId: poll._id, voterKey: key });
      if (existing) return res.status(409).json({ error: 'You have already voted in this poll' });

      await PollVote.create({
        pollId: poll._id,
        optionId,
        userId: req.user._id,
        voterKey: key,
        ipHash: ipHash(req),
      });

      const votes = await PollVote.find({ pollId: poll._id });
      const analysis = buildAnalysis(poll, votes, []);

      const leader = analysis.leader?.displayName;
      emitSocketNotification(req, {
        id: `poll-vote-${poll._id}-${Date.now()}`,
        type: 'results',
        title: 'Poll updated',
        message: leader
          ? `${leader} is now leading in "${poll.title}".`
          : `New prediction recorded in "${poll.title}".`,
        link: `/polls/${poll._id}`,
      });

      res.status(201).json({
        message: 'Prediction recorded',
        analysis,
        disclaimer: 'Public opinion poll — not an official vote',
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'You have already voted in this poll' });
      }
      console.error('Poll vote error:', err.message);
      res.status(500).json({ error: 'Failed to record prediction' });
    }
  }
);

router.get('/:id/comments', async (req, res) => {
  const comments = await PollComment.find({ pollId: req.params.id, isReported: { $ne: true } })
    .sort({ createdAt: -1 });
  const threaded = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);
  res.json({
    comments: threaded.map((c) => ({
      ...c.toObject(),
      replies: replies.filter((r) => String(r.parentId) === String(c._id)),
    })),
  });
});

router.post(
  '/:id/comments',
  authenticate,
  [
    body('content').notEmpty().trim().isLength({ max: 2000 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const poll = await PredictionPoll.findById(req.params.id);
      if (!poll) return res.status(404).json({ error: 'Poll not found' });

      const authorName = req.user.fullName;
      const comment = await PollComment.create({
        pollId: poll._id,
        userId: req.user._id,
        authorName,
        content: req.body.content,
        parentId: req.body.parentId || null,
      });

      emitSocketNotification(req, {
        id: `poll-comment-${comment._id}`,
        type: 'election',
        title: 'New poll comment',
        message: `${authorName} commented on "${poll.title}".`,
        link: `/polls/${poll._id}`,
      });

      res.status(201).json({ comment });
    } catch (err) {
      console.error('Poll comment error:', err.message);
      res.status(500).json({ error: 'Failed to post comment' });
    }
  }
);

router.post('/comments/:commentId/report', optionalAuthenticate, async (req, res) => {
  const comment = await PollComment.findByIdAndUpdate(
    req.params.commentId,
    { isReported: true },
    { new: true }
  );
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  res.json({ message: 'Comment reported for moderation' });
});

module.exports = router;
