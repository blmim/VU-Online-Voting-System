const config = require('../config');

function isTestGeneratorEnabled() {
  return config.allowTestGenerator;
}

function requireTestGenerator(req, res, next) {
  if (!isTestGeneratorEnabled()) {
    return res.status(403).json({
      error: 'Test data generator is disabled in production. Set ALLOW_TEST_GENERATOR=true to enable.',
    });
  }
  next();
}

module.exports = { requireTestGenerator, isTestGeneratorEnabled };
