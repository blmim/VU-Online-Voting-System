const express = require('express');
const path = require('path');
const fs = require('fs');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const CertifiedResult = require('../models/CertifiedResult');
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middleware/auth');
const { aggregateLiveResults, aggregateVoteTimeline } = require('../services/resultsService');
const { escapeRegex } = require('../utils/escapeRegex');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, phase } = req.query;
    const filter = { status: { $in: ['published', 'active', 'closed', 'certified'] } };
    if (q) {
      const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    let elections = await Election.find(filter).sort({ startTime: -1 }).limit(50);
    const now = Date.now();

    if (phase === 'active') {
      elections = elections.filter((e) => {
        const start = new Date(e.startTime).getTime();
        const end = new Date(e.endTime).getTime();
        return ['published', 'active'].includes(e.status) && start <= now && end >= now;
      });
    } else if (phase === 'upcoming') {
      elections = elections.filter((e) => new Date(e.startTime).getTime() > now);
    } else if (phase === 'finished') {
      elections = elections.filter((e) => {
        const end = new Date(e.endTime).getTime();
        return ['closed', 'certified'].includes(e.status) || end < now;
      });
    }

    let candidateMatches = [];
    if (q) {
      const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
      const candidates = await Candidate.find({ displayName: regex, isActive: true })
        .populate('electionId', 'title status startTime endTime settings')
        .limit(30);
      candidateMatches = candidates
        .filter((c) => c.electionId)
        .map((c) => ({
          candidateId: c._id,
          displayName: c.displayName,
          election: c.electionId,
        }));
    }

    res.json({ elections, candidateMatches, query: q || '' });
  } catch (err) {
    console.error('Results search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/live/:electionId/timeline', optionalAuthenticate, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ error: 'Not found' });

    const isPublic = election.settings?.showLiveResultsPublic === true;
    const isAdmin = req.user?.role === 'admin';
    if (!isPublic && !isAdmin) {
      return res.status(403).json({ error: 'Live results not public' });
    }

    const timeline = await aggregateVoteTimeline(req.params.electionId);
    res.json({ election: { title: election.title, status: election.status }, ...timeline });
  } catch (err) {
    console.error('Timeline error:', err.message);
    res.status(500).json({ error: 'Failed to load vote timeline' });
  }
});

router.get('/live/:electionId', optionalAuthenticate, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ error: 'Not found' });

    const isPublic = election.settings?.showLiveResultsPublic === true;
    const isAdmin = req.user?.role === 'admin';

    if (!isPublic && !isAdmin) {
      return res.status(403).json({ error: 'Live results not public' });
    }

    const results = await aggregateLiveResults(req.params.electionId);
    res.json({ election: { title: election.title, status: election.status }, ...results });
  } catch (err) {
    console.error('Live results error:', err.message);
    res.status(500).json({ error: 'Failed to load live results' });
  }
});

router.get('/certified/:electionId', async (req, res) => {
  const election = await Election.findById(req.params.electionId).select('status');
  if (!election) return res.status(404).json({ error: 'Not found' });
  if (!['closed', 'certified'].includes(election.status)) {
    return res.status(403).json({ error: 'Certified results not available until election is closed' });
  }

  const results = await CertifiedResult.find({ electionId: req.params.electionId })
    .populate('positionId', 'title seats')
    .populate('candidateId', 'displayName');
  res.json({ results });
});

router.get('/export/:electionId/pdf', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election?.pdfReportPath) return res.status(404).json({ error: 'PDF not ready' });
  const filePath = path.join(__dirname, '../..', election.pdfReportPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath);
});

router.get('/export/:electionId/excel', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election?.excelReportPath) return res.status(404).json({ error: 'Excel not ready' });
  const filePath = path.join(__dirname, '../..', election.excelReportPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });
  res.download(filePath);
});

module.exports = router;
