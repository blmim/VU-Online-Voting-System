const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

function extractToken(req) {
  // Privileged HTTP routes: Bearer Authorization or httpOnly cookie only (never req.body.token)
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
}

async function loadUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return null;
    if (user.lockedUntil && user.lockedUntil > new Date()) return null;
    return user;
  } catch {
    return null;
  }
}

async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Soft auth: attaches req.user when a valid token is present; never 401s. */
async function optionalAuthenticate(req, res, next) {
  req.user = await loadUserFromToken(extractToken(req));
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireVerified(req, res, next) {
  if (!req.user?.isVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
}

function signToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : config.jwtExpiresIn;
  return jwt.sign(
    { userId: user._id, role: user.role, studentId: user.studentId },
    config.jwtSecret,
    { expiresIn }
  );
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireVerified,
  signToken,
  loadUserFromToken,
  extractToken,
};
