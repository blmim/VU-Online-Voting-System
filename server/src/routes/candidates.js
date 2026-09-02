const express = require('express');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const User = require('../models/User');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { TEAM_PHOTO_BY_STUDENT, enrichCandidates } = require('../utils/candidateEnrichment');

const router = express.Router();

function profileFields(candidate) {
  return {
    candidateId: candidate._id,
    displayName: candidate.displayName,
    tagline: candidate.tagline || '',
    bio: candidate.bio || '',
    whyRunning: candidate.whyRunning || '',
    inspiration: candidate.inspiration || '',
    goals: candidate.goals || '',
    experience: candidate.experience || '',
    speech: candidate.speech || '',
    manifesto: candidate.manifesto || '',
    socialLinks: candidate.socialLinks || {},
    profileComplete: candidate.profileComplete ?? candidate.computeProfileComplete?.() ?? false,
    electionId: candidate.electionId,
    positionId: candidate.positionId,
    photoUrl: candidate.photoUrl,
    positionTitle: candidate.positionTitle,
    studentId: candidate.studentId,
  };
}

router.get('/me/status', authenticate, async (req, res) => {
  try {
    const candidates = await Candidate.find({ userId: req.user._id, isActive: true })
      .populate('positionId', 'title')
      .populate('electionId', 'title status');
    res.json({
      isCandidate: candidates.length > 0,
      candidates: candidates.map((c) => ({
        _id: c._id,
        displayName: c.displayName,
        election: c.electionId,
        position: c.positionId,
      })),
    });
  } catch (err) {
    console.error('Candidate status error:', err.message);
    res.status(500).json({ error: 'Failed to load candidate status' });
  }
});

router.get('/me/profile', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user._id, isActive: true })
      .sort({ updatedAt: -1 });
    if (!candidate) {
      return res.status(404).json({ error: 'You are not an approved candidate' });
    }
    const [enriched] = await enrichCandidates([candidate]);
    const position = await Position.findById(candidate.positionId).select('title');
    res.json({
      profile: {
        ...profileFields({ ...enriched, positionTitle: position?.title }),
      },
    });
  } catch (err) {
    console.error('My profile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.put(
  '/me/profile',
  authenticate,
  [
    body('tagline').optional().isString().isLength({ max: 160 }),
    body('bio').optional().isString().isLength({ max: 3000 }),
    body('whyRunning').optional().isString().isLength({ max: 2000 }),
    body('inspiration').optional().isString().isLength({ max: 1000 }),
    body('goals').optional().isString().isLength({ max: 2000 }),
    body('experience').optional().isString().isLength({ max: 2000 }),
    body('speech').optional().isString().isLength({ max: 4000 }),
    body('manifesto').optional().isString().isLength({ max: 2000 }),
    body('socialLinks').optional().isObject(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const candidate = await Candidate.findOne({ userId: req.user._id, isActive: true });
      if (!candidate) {
        return res.status(403).json({ error: 'Only approved candidates can update their profile' });
      }

      const fields = ['tagline', 'bio', 'whyRunning', 'inspiration', 'goals', 'experience', 'speech', 'manifesto'];
      for (const f of fields) {
        if (req.body[f] !== undefined) candidate[f] = req.body[f];
      }
      if (req.body.socialLinks) {
        candidate.socialLinks = { ...candidate.socialLinks?.toObject?.() ?? candidate.socialLinks ?? {}, ...req.body.socialLinks };
      }
      candidate.profileComplete = candidate.computeProfileComplete();
      await candidate.save();

      const [enriched] = await enrichCandidates([candidate]);
      res.json({ profile: profileFields(enriched), message: 'Profile updated' });
    } catch (err) {
      console.error('Profile update error:', err.message);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

router.get('/:id/profile', optionalAuthenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, isActive: true });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const [enriched] = await enrichCandidates([candidate]);
    const position = await Position.findById(candidate.positionId).select('title description');
    res.json({
      profile: {
        ...profileFields({ ...enriched, positionTitle: position?.title }),
        positionDescription: position?.description,
      },
    });
  } catch (err) {
    console.error('Candidate profile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.get('/:id/photo', optionalAuthenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const user = await User.findById(candidate.userId).select('referenceSelfiePath studentId');
    if (!user?.referenceSelfiePath) {
      return res.status(404).json({ error: 'No photo available' });
    }

    const teamPhoto = TEAM_PHOTO_BY_STUDENT[String(user.studentId || '').toLowerCase()];
    if (teamPhoto) {
      return res.redirect(teamPhoto);
    }

    const filePath = path.join(__dirname, '../..', user.referenceSelfiePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file missing' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('Candidate photo error:', err.message);
    res.status(500).json({ error: 'Failed to load photo' });
  }
});

module.exports = router;
