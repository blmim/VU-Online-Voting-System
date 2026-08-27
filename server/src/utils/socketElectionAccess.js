const mongoose = require('mongoose');
const Election = require('../models/Election');
const { loadUserFromToken } = require('../middleware/auth');

/**
 * Join payloads may be a bare election id or `{ electionId }`.
 * Tokens in the payload are ignored — use handshake.auth, Authorization, or cookie.
 */
function normalizeJoinPayload(payload) {
  if (payload == null) return { electionId: null };
  if (typeof payload === 'string' || typeof payload === 'number') {
    return { electionId: String(payload) };
  }
  if (typeof payload === 'object') {
    const electionId = payload.electionId ?? payload.id ?? null;
    return { electionId: electionId != null ? String(electionId) : null };
  }
  return { electionId: null };
}

/** Prefer Socket.IO handshake auth, then Authorization header, then httpOnly cookie. */
function tokenFromSocket(socket) {
  if (socket.handshake?.auth?.token) return socket.handshake.auth.token;
  const header = socket.handshake?.headers?.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookieHeader = socket.handshake?.headers?.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Public live rooms when showLiveResultsPublic; otherwise admin JWT required
 * via handshake/cookie/Authorization (not join-payload body token).
 */
async function authorizeElectionJoin(socket, payload) {
  const { electionId } = normalizeJoinPayload(payload);
  if (!electionId || !mongoose.isValidObjectId(electionId)) {
    return { ok: false, reason: 'invalid_election' };
  }

  const election = await Election.findById(electionId).select('settings');
  if (!election) return { ok: false, reason: 'not_found' };

  if (election.settings?.showLiveResultsPublic === true) {
    return { ok: true, electionId, room: `election:${electionId}` };
  }

  const user = await loadUserFromToken(tokenFromSocket(socket));
  if (user?.role === 'admin') {
    return { ok: true, electionId, room: `election:${electionId}` };
  }

  return { ok: false, reason: 'forbidden', electionId };
}

module.exports = {
  authorizeElectionJoin,
  normalizeJoinPayload,
  tokenFromSocket,
};
