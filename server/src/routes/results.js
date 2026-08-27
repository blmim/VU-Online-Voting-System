const express = require('express');
const path = require('path');
const fs = require('fs');
const Election = require('../models/Election');
const CertifiedResult = require('../models/CertifiedResult');
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middleware/auth');
const { aggregateLiveResults } = require('../services/resultsService');

const router = express.Router();

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
