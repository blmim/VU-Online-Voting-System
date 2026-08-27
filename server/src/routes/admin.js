const express = require('express');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const CandidateApplication = require('../models/CandidateApplication');
const AnomalyReview = require('../models/AnomalyReview');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { aggregateLiveResults } = require('../services/resultsService');
const { sendTemplate } = require('../services/emailService');
const Announcement = require('../models/Announcement');
const { escapeRegex } = require('../utils/escapeRegex');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', async (req, res) => {
  const [voters, elections, applications, anomalies, recentLogs] = await Promise.all([
    User.countDocuments({ role: 'voter' }),
    Election.countDocuments(),
    CandidateApplication.countDocuments({ status: 'pending' }),
    AnomalyReview.countDocuments({ status: 'pending' }),
    AuditLog.find().sort({ occurredAt: -1 }).limit(20),
  ]);

  const activeElections = await Election.find({ status: 'active' });
  const turnoutData = [];
  for (const e of activeElections) {
    const live = await aggregateLiveResults(e._id);
    turnoutData.push({ electionId: e._id, title: e.title, ...live });
  }

  res.json({
    stats: { voters, elections, pendingApplications: applications, pendingAnomalies: anomalies },
    activeElections: turnoutData,
    recentLogs,
  });
});

router.get('/users/search', async (req, res) => {
  const { q } = req.query;
  let users;
  if (q) {
    const safeQ = escapeRegex(String(q).slice(0, 100));
    users = await User.find({
      $or: [
        { fullName: new RegExp(safeQ, 'i') },
        { studentId: new RegExp(safeQ, 'i') },
        { email: new RegExp(safeQ, 'i') },
      ],
    }).select('-passwordHash').limit(50);
  } else {
    users = await User.find().select('-passwordHash').limit(50);
  }
  res.json({ users });
});

router.get('/candidates/search', async (req, res) => {
  const { q, electionId } = req.query;
  const filter = electionId ? { electionId } : {};
  let candidates = await Candidate.find(filter)
    .populate('userId', 'fullName studentId')
    .populate('positionId', 'title')
    .limit(50);

  if (q) {
    const lower = q.toLowerCase();
    candidates = candidates.filter((c) => c.displayName.toLowerCase().includes(lower));
  }
  res.json({ candidates });
});

router.get('/anomalies', async (req, res) => {
  const anomalies = await AnomalyReview.find({ status: 'pending' })
    .populate('userId', 'fullName studentId email')
    .populate('electionId', 'title')
    .sort({ createdAt: -1 });
  res.json({ anomalies });
});

router.post('/anomalies/:id/review', async (req, res) => {
  const { status, notes } = req.body;
  const allowedStatuses = ['cleared', 'flagged'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid review status' });
  }
  if (status === 'flagged' && !notes?.trim()) {
    return res.status(400).json({ error: 'Review notes required when flagging an anomaly' });
  }
  const anomaly = await AnomalyReview.findByIdAndUpdate(
    req.params.id,
    { status, reviewNotes: notes, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );
  await AuditLog.appendLog({
    event: 'ANOMALY_REVIEWED',
    userId: req.user._id,
    electionId: anomaly.electionId,
    metadata: { anomalyId: anomaly._id, status },
  });
  res.json({ anomaly });
});

router.post('/announcements', async (req, res) => {
  const { title, body, electionId } = req.body;
  let recipients = await User.find({ role: 'voter', isVerified: true });

  if (electionId) {
    const voted = await Vote.distinct('userId', { electionId });
    const notVoted = recipients.filter((u) => !voted.find((v) => v.toString() === u._id.toString()));
    recipients = notVoted;
  }

  for (const user of recipients) {
    await sendTemplate(user.email, 'announcement', title, body);
  }

  const announcement = await Announcement.create({
    title,
    body,
    electionId: electionId || undefined,
    recipientCount: recipients.length,
    sentBy: req.user._id,
  });

  res.json({ message: `Sent to ${recipients.length} voters`, announcementId: announcement._id });
});

router.get('/announcements/last', async (req, res) => {
  const last = await Announcement.findOne().sort({ sentAt: -1 });
  if (!last) return res.status(404).json({ error: 'No announcements sent yet' });
  res.json({ announcement: last });
});

router.post('/announcements/:id/resend', async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

  let recipients = await User.find({ role: 'voter', isVerified: true });
  if (announcement.electionId) {
    const voted = await Vote.distinct('userId', { electionId: announcement.electionId });
    recipients = recipients.filter((u) => !voted.find((v) => v.toString() === u._id.toString()));
  }

  for (const user of recipients) {
    await sendTemplate(user.email, 'announcement', announcement.title, announcement.body);
  }

  res.json({ message: `Resent to ${recipients.length} voters` });
});

router.get('/audit-logs', async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ occurredAt: -1 })
    .limit(100)
    .populate('userId', 'fullName studentId');
  res.json({ logs });
});

router.get('/users/admins', async (req, res) => {
  const admins = await User.find({ role: 'admin' })
    .select('-passwordHash')
    .sort({ fullName: 1 });
  res.json({ admins });
});

router.post('/users/:id/promote', async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') {
    return res.status(400).json({ error: 'User is already an administrator' });
  }

  target.role = 'admin';
  await target.save();

  const user = await User.findById(target._id).select('-passwordHash');
  await AuditLog.appendLog({
    event: 'USER_PROMOTED_TO_ADMIN',
    userId: req.user._id,
    metadata: {
      targetUserId: target._id,
      targetStudentId: target.studentId,
      targetEmail: target.email,
      promotedBy: req.user.studentId,
    },
    ipAddress: req.ip,
  });

  const response = {
    user,
    message: `${user.fullName} has been added as an administrator`,
  };
  if (!user.isVerified) {
    response.warning = 'This user has not completed email verification yet.';
  }
  res.json(response);
});

router.post('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['voter', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = await User.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (role === 'voter' && existing.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the only administrator' });
    }
  }

  const previousRole = existing.role;
  existing.role = role;
  await existing.save();

  const user = await User.findById(existing._id).select('-passwordHash');
  await AuditLog.appendLog({
    event: 'USER_ROLE_CHANGED',
    userId: req.user._id,
    metadata: {
      targetUserId: existing._id,
      targetStudentId: existing.studentId,
      previousRole,
      newRole: role,
      changedBy: req.user.studentId,
    },
    ipAddress: req.ip,
  });

  res.json({ user });
});

module.exports = router;
