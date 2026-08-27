const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requireTestGenerator } = require('../middleware/testGenerator');
const {
  generateTestVoters,
  generateTestCandidates,
  resetAndSeedDemoElection,
  isTestGeneratorEnabled,
} = require('../services/testDataGenerator');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/status', (req, res) => {
  res.json({ enabled: isTestGeneratorEnabled() });
});

router.post('/voters', requireTestGenerator, async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 5, 1), 50);
    const result = await generateTestVoters(count, req.user._id, req.ip);
    res.status(201).json({
      message: `Generated ${result.users.length} test voters`,
      password: result.password,
      users: result.users,
    });
  } catch (err) {
    console.error('Generate voters error:', err.message);
    res.status(500).json({ error: 'Failed to generate voters' });
  }
});

router.post('/candidates', requireTestGenerator, async (req, res) => {
  try {
    const { electionId } = req.body;
    if (!electionId) return res.status(400).json({ error: 'electionId is required' });

    const count = Math.min(Math.max(parseInt(req.body.count, 10) || 5, 1), 20);
    const result = await generateTestCandidates(electionId, count, req.user._id, req.ip);
    res.status(201).json({
      message: `Generated ${result.candidates.length} test candidates`,
      candidates: result.candidates,
    });
  } catch (err) {
    console.error('Generate candidates error:', err.message);
    const status = err.status || 500;
    // Controlled client errors (e.g. missing election) keep their message; 500s stay generic
    if (status < 500 && err.message) {
      return res.status(status).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to generate candidates' });
  }
});

router.post('/demo', requireTestGenerator, async (req, res) => {
  try {
    const result = await resetAndSeedDemoElection(req.user._id, req.ip);
    res.status(201).json({
      message: 'Demo election reset and seeded',
      ...result,
    });
  } catch (err) {
    console.error('Seed demo election error:', err.message);
    res.status(500).json({ error: 'Failed to seed demo election' });
  }
});

module.exports = router;
