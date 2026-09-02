const User = require('../models/User');
const Position = require('../models/Position');
const { dedupeCandidates } = require('./dedupeCandidates');

/** Public team photos for seeded demo candidates (Capstone Group 6). */
const TEAM_PHOTO_BY_STUDENT = {
  s8114083: '/team/adil.jpeg',
  s8072671: '/team/amith.jpeg',
  s8116502: '/team/ranjana.jpeg',
  s8139428: '/team/samir.webp',
};

function photoUrlForCandidate(candidateId, studentId) {
  const key = String(studentId || '').toLowerCase();
  if (TEAM_PHOTO_BY_STUDENT[key]) return TEAM_PHOTO_BY_STUDENT[key];
  if (candidateId) return `/api/candidates/${candidateId}/photo`;
  return null;
}

async function enrichCandidates(candidates) {
  const unique = dedupeCandidates(candidates);
  if (!unique.length) return [];
  const userIds = unique.map((c) => c.userId).filter(Boolean);
  const positionIds = unique.map((c) => c.positionId).filter(Boolean);
  const [users, positions] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('studentId fullName referenceSelfiePath'),
    Position.find({ _id: { $in: positionIds } }).select('title'),
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const positionMap = new Map(positions.map((p) => [String(p._id), p]));

  return unique.map((c) => {
    const doc = c.toObject ? c.toObject() : { ...c };
    const user = userMap.get(String(doc.userId));
    const position = positionMap.get(String(doc.positionId));
    return {
      ...doc,
      positionTitle: position?.title,
      studentId: user?.studentId,
      photoUrl: photoUrlForCandidate(doc._id, user?.studentId),
      hasReferencePhoto: Boolean(user?.referenceSelfiePath),
      profileComplete: doc.profileComplete ?? Boolean(doc.tagline && doc.bio && doc.speech && doc.whyRunning),
    };
  });
}

module.exports = { enrichCandidates, photoUrlForCandidate, TEAM_PHOTO_BY_STUDENT };
