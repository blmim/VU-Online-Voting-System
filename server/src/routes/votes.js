const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const User = require('../models/User');
const AnomalyReview = require('../models/AnomalyReview');
const { authenticate, requireVerified } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { saveSelfie, compareFaces } = require('../services/faceVerification');
const { generateReceipt } = require('../utils/receipt');
const { sendTemplate } = require('../services/emailService');
const AuditLog = require('../models/AuditLog');
const { notifyAdmins } = require('../utils/emailRecipients');
const { userMeetsEligibility } = require('../services/eligibilityService');
const { emitSocketNotification } = require('../utils/socketNotify');

const router = express.Router();

async function persistVotes(selections, votePayload, session) {
  const createdVotes = [];
  const createOptions = session ? { session } : undefined;

  for (const sel of selections) {
    const [vote] = await Vote.create(
      [
        {
          userId: votePayload.userId,
          electionId: votePayload.electionId,
          positionId: sel.positionId,
          candidateId: sel.candidateId,
          receiptToken: votePayload.receipt,
          voteSelfiePath: votePayload.voteSelfiePath,
          faceMatchScore: votePayload.faceMatchScore,
          faceAnomalyFlag: votePayload.faceAnomalyFlag,
          ipAddress: votePayload.ipAddress,
        },
      ],
      createOptions
    );
    createdVotes.push(vote);
  }

  return createdVotes;
}

router.post(
  '/',
  authenticate,
  requireVerified,
  [
    body('electionId').notEmpty(),
    body('selections').isArray({ min: 1 }),
    body('voteSelfie').optional(),
  ],
  handleValidation,
  async (req, res) => {
    let session = null;
    try {
      const { electionId, selections, voteSelfie } = req.body;
      const election = await Election.findById(electionId);
      if (!election || !['published', 'active'].includes(election.status)) {
        return res.status(400).json({ error: 'Election not available for voting' });
      }

      const requireSelfie = election.settings?.requireSelfieVerification !== false;
      if (requireSelfie && !voteSelfie) {
        return res.status(400).json({ error: 'Vote selfie required' });
      }

      const now = new Date();
      if (now < election.startTime || now > election.endTime) {
        return res.status(400).json({ error: 'Outside voting window' });
      }

      const user = await User.findById(req.user._id);
      let selfieData = null;
      let faceResult = { score: 1, anomaly: false };

      if (requireSelfie) {
        if (!user.referenceSelfiePath) {
          return res.status(400).json({ error: 'Reference selfie missing — re-register' });
        }
        selfieData = await saveSelfie(voteSelfie, 'vote', user.studentId);
        faceResult = await compareFaces(user.referenceSelfiePath, selfieData.relativePath);
      }

      const seenPositions = new Set();
      for (const sel of selections) {
        const posKey = String(sel.positionId);
        if (seenPositions.has(posKey)) {
          return res.status(400).json({ error: 'Duplicate position in ballot selections' });
        }
        seenPositions.add(posKey);

        const position = await Position.findOne({ _id: sel.positionId, electionId });
        if (!position) {
          return res.status(400).json({ error: 'Invalid position selection' });
        }

        const eligibility = userMeetsEligibility(user, position.eligibility);
        if (!eligibility.eligible) {
          return res.status(403).json({
            error: eligibility.reason || 'Not eligible to vote for this position',
          });
        }

        const existing = await Vote.findOne({
          userId: req.user._id,
          electionId,
          positionId: sel.positionId,
        });
        if (existing) {
          return res.status(409).json({ error: `Already voted for position ${sel.positionId}` });
        }

        const candidate = await Candidate.findOne({
          _id: sel.candidateId,
          positionId: sel.positionId,
          electionId,
          isActive: true,
        });
        if (!candidate) {
          return res.status(400).json({ error: 'Invalid candidate selection' });
        }

        if (String(candidate.userId) === String(req.user._id)) {
          return res.status(400).json({
            error: 'You cannot vote for yourself. Candidates contest the election; voters choose among other candidates.',
          });
        }

        const selfOnPosition = await Candidate.findOne({
          electionId,
          positionId: sel.positionId,
          userId: req.user._id,
          isActive: true,
        });
        if (selfOnPosition) {
          return res.status(400).json({
            error: 'You are a candidate for this position and cannot vote in your own race.',
          });
        }
      }

      const receipt = generateReceipt(req.user._id, electionId);
      const votePayload = {
        userId: req.user._id,
        electionId,
        receipt,
        voteSelfiePath: selfieData?.relativePath,
        faceMatchScore: faceResult.score,
        faceAnomalyFlag: faceResult.anomaly,
        ipAddress: req.ip,
      };

      let createdVotes = [];
      session = await mongoose.startSession();
      try {
        session.startTransaction();
        createdVotes = await persistVotes(selections, votePayload, session);
        await session.commitTransaction();
      } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        if (err.message?.includes('replica set')) {
          createdVotes = await persistVotes(selections, votePayload, null);
        } else if (err.code === 11000) {
          return res.status(409).json({ error: 'Duplicate vote detected' });
        } else {
          throw err;
        }
      } finally {
        session.endSession();
        session = null;
      }

      if (faceResult.anomaly) {
        for (const v of createdVotes) {
          await AnomalyReview.create({
            voteId: v._id,
            userId: req.user._id,
            electionId,
            referenceSelfiePath: user.referenceSelfiePath,
            voteSelfiePath: selfieData.relativePath,
            faceMatchScore: faceResult.score,
            status: 'pending',
          });
        }
        await notifyAdmins((adminEmail) =>
          sendTemplate(
            adminEmail,
            'anomalyAlert',
            user.fullName,
            user.studentId,
            election.title,
            faceResult.score
          )
        );
      }

      await AuditLog.appendLog({
        event: 'VOTE_CAST',
        userId: req.user._id,
        electionId,
        ipAddress: req.ip,
        metadata: { receipt, faceScore: faceResult.score, anomaly: faceResult.anomaly },
      });

      let confirmationEmailSent = false;
      if (election.settings?.sendVoteConfirmationEmail !== false) {
        try {
          await sendTemplate(user.email, 'voteConfirmation', election.title, receipt);
          confirmationEmailSent = true;
        } catch (emailErr) {
          console.error('Vote confirmation email failed (vote still recorded):', emailErr.message);
        }
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`election:${electionId}`).emit('vote:update', { electionId });
        emitSocketNotification(req, {
          id: `live-vote-${Date.now()}`,
          type: 'results',
          title: 'New vote cast',
          message: `A new ballot was recorded in ${election.title}. Live results updated.`,
          link: `/live/${electionId}`,
        });
      }

      res.status(201).json({
        receipt,
        faceMatchScore: faceResult.score,
        anomalyFlagged: faceResult.anomaly,
        confirmationEmailSent,
      });
    } catch (err) {
      if (session?.inTransaction?.()) await session.abortTransaction();
      if (session) session.endSession();
      console.error('Vote cast error:', err.message);
      if (err.status && err.status < 500 && err.message) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: 'Failed to cast vote' });
    }
  }
);

router.get('/receipt/:electionId', authenticate, async (req, res) => {
  const vote = await Vote.findOne({ userId: req.user._id, electionId: req.params.electionId });
  if (!vote) return res.status(404).json({ error: 'No vote found' });
  res.json({ receipt: vote.receiptToken, castAt: vote.castAt });
});

router.get('/verify/:receipt', async (req, res) => {
  try {
    const receipt = String(req.params.receipt || '').trim().toUpperCase();
    if (!receipt) return res.status(400).json({ error: 'Receipt code required' });

    const vote = await Vote.findOne({ receiptToken: receipt }).populate('electionId', 'title status endTime');
    if (!vote) return res.status(404).json({ error: 'Receipt not found', valid: false });

    res.json({
      valid: true,
      receipt: vote.receiptToken,
      castAt: vote.castAt,
      election: vote.electionId ? {
        title: vote.electionId.title,
        status: vote.electionId.status,
      } : null,
      message: 'This receipt confirms a vote was recorded. Candidate choices are kept secret.',
    });
  } catch (err) {
    console.error('Receipt verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
