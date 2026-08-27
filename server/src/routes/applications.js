const express = require('express');
const { body } = require('express-validator');
const CandidateApplication = require('../models/CandidateApplication');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const Election = require('../models/Election');
const { authenticate, requireAdmin, requireVerified } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { userMeetsEligibility } = require('../services/eligibilityService');
const { sendTemplate } = require('../services/emailService');
const AuditLog = require('../models/AuditLog');
const { notifyAdmins } = require('../utils/emailRecipients');

const router = express.Router();

router.get('/search', authenticate, requireAdmin, async (req, res) => {
  const { q, status, electionId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (electionId) filter.electionId = electionId;

  let applications = await CandidateApplication.find(filter)
    .populate('applicantId', 'fullName studentId email faculty department year')
    .populate('positionId', 'title')
    .populate('electionId', 'title')
    .sort({ createdAt: -1 });

  if (q) {
    const lower = q.toLowerCase();
    applications = applications.filter(
      (a) =>
        a.applicantId?.fullName?.toLowerCase().includes(lower) ||
        a.applicantId?.studentId?.toLowerCase().includes(lower) ||
        a.positionId?.title?.toLowerCase().includes(lower)
    );
  }

  res.json({ applications });
});

router.post(
  '/',
  authenticate,
  requireVerified,
  [body('electionId').notEmpty(), body('positionId').notEmpty()],
  handleValidation,
  async (req, res) => {
    try {
      const { electionId, positionId, manifesto } = req.body;
      const election = await Election.findById(electionId);
      if (!election?.allowCandidateApplications) {
        return res.status(400).json({ error: 'Applications not open' });
      }

      const position = await Position.findById(positionId);
      if (!position || position.electionId.toString() !== electionId) {
        return res.status(400).json({ error: 'Invalid position for this election' });
      }

      const eligibility = userMeetsEligibility(req.user, position.eligibility);
      if (!eligibility.eligible) {
        return res.status(403).json({ error: eligibility.reason });
      }

      const existing = await CandidateApplication.findOne({
        electionId,
        positionId,
        applicantId: req.user._id,
      });
      if (existing) return res.status(409).json({ error: 'Already applied' });

      const application = await CandidateApplication.create({
        electionId,
        positionId,
        applicantId: req.user._id,
        manifesto: manifesto || '',
      });

      await sendTemplate(
        req.user.email,
        'applicationSubmitted',
        election.title,
        position.title
      );
      await notifyAdmins((adminEmail) =>
        sendTemplate(
          adminEmail,
          'adminNewApplication',
          req.user.fullName,
          req.user.studentId,
          election.title,
          position.title
        )
      );
      await AuditLog.appendLog({
        event: 'CANDIDATE_APPLIED',
        userId: req.user._id,
        electionId,
        metadata: { positionId },
      });

      res.status(201).json({ application });
    } catch (err) {
      console.error('Application submit error:', err.message);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  }
);

router.get('/my', authenticate, async (req, res) => {
  const applications = await CandidateApplication.find({ applicantId: req.user._id })
    .populate('electionId', 'title status')
    .populate('positionId', 'title');
  res.json({ applications });
});

router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const application = await CandidateApplication.findById(req.params.id)
      .populate('applicantId')
      .populate('electionId')
      .populate('positionId');
    if (!application || application.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid application' });
    }
    if (!application.applicantId || !application.electionId || !application.positionId) {
      return res.status(400).json({ error: 'Application has missing linked records' });
    }

    let candidate = await Candidate.findOne({
      electionId: application.electionId._id,
      positionId: application.positionId._id,
      userId: application.applicantId._id,
    });

    if (!candidate) {
      candidate = await Candidate.create({
        electionId: application.electionId._id,
        positionId: application.positionId._id,
        userId: application.applicantId._id,
        displayName: application.applicantId.fullName,
        manifesto: application.manifesto,
        applicationId: application._id,
      });
    } else {
      candidate.isActive = true;
      candidate.manifesto = application.manifesto || candidate.manifesto;
      candidate.applicationId = application._id;
      await candidate.save();
    }

    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.candidateId = candidate._id;
    await application.save();

    await sendTemplate(
      application.applicantId.email,
      'applicationApproved',
      application.electionId.title,
      application.positionId.title
    );
    await AuditLog.appendLog({
      event: 'CANDIDATE_APPROVED',
      userId: req.user._id,
      electionId: application.electionId._id,
      metadata: { applicationId: application._id },
    });

    res.json({ application, candidate });
  } catch (err) {
    console.error('Approve application error:', err.message);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

router.post(
  '/:id/reject',
  authenticate,
  requireAdmin,
  [body('reason').optional()],
  handleValidation,
  async (req, res) => {
    try {
      const application = await CandidateApplication.findById(req.params.id)
        .populate('applicantId')
        .populate('electionId')
        .populate('positionId');
      if (!application) return res.status(404).json({ error: 'Not found' });
      if (!application.applicantId || !application.electionId || !application.positionId) {
        return res.status(400).json({ error: 'Application has missing linked records' });
      }

      application.status = 'rejected';
      application.rejectionReason = req.body.reason || '';
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
      await application.save();

      await sendTemplate(
        application.applicantId.email,
        'applicationRejected',
        application.electionId.title,
        application.positionId.title,
        application.rejectionReason
      );

      res.json({ application });
    } catch (err) {
      console.error('Reject application error:', err.message);
      res.status(500).json({ error: 'Failed to reject application' });
    }
  }
);

module.exports = router;
