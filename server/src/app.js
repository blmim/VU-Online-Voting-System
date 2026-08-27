const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { sanitizeInput } = require('./middleware/sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./config');

const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const applicationRoutes = require('./routes/applications');
const voteRoutes = require('./routes/votes');
const resultsRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');
const adminGenerateRoutes = require('./routes/adminGenerate');
const notificationRoutes = require('./routes/notifications');

function createApp() {
  const app = express();

  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(cookieParser());

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(sanitizeInput);
  app.use('/uploads', (req, res, next) => {
    if (req.path.startsWith('/selfies')) {
      return res.status(403).json({ error: 'Selfie images are not publicly accessible' });
    }
    next();
  }, express.static(path.join(__dirname, '../uploads')));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts' },
  });

  const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many vote attempts' },
  });

  app.use('/api/auth', authLimiter);
  app.use('/api/votes', voteLimiter);

  // Swagger UI: development/demo only — disabled when NODE_ENV=production
  if (process.env.NODE_ENV !== 'production') {
    const swaggerSpec = swaggerJsdoc({
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'VU Online Voting System API',
          version: '1.0.0',
          description: 'NIT3003 Capstone — Campus Elections MERN API',
        },
        servers: [{ url: `http://localhost:${config.port}` }],
      },
      apis: ['./src/routes/*.js'],
    });
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/elections', electionRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/votes', voteRoutes);
  app.use('/api/results', resultsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/generate', adminGenerateRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
