const config = require('../config');

const COOKIE_NAME = 'token';
const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token, rememberMe = false) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: rememberMe ? REMEMBER_MAX_AGE_MS : DEFAULT_MAX_AGE_MS,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
