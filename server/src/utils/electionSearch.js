const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const { escapeRegex } = require('./escapeRegex');
const { groupCandidateMatches } = require('./dedupeCandidates');
const { photoUrlForCandidate } = require('./candidateEnrichment');

const PUBLIC_STATUSES = ['published', 'active', 'closed', 'certified'];

function filterElectionsByPhase(elections, phase) {
  if (!phase || phase === 'all') return elections;
  const now = Date.now();
  return elections.filter((e) => {
    const start = new Date(e.startTime).getTime();
    const end = new Date(e.endTime).getTime();
    if (phase === 'active') {
      return PUBLIC_STATUSES.includes(e.status) && start <= now && end >= now;
    }
    if (phase === 'upcoming') return start > now;
    if (phase === 'finished') {
      return ['closed', 'certified'].includes(e.status) || end < now;
    }
    return true;
  });
}

function mapCandidateRow(c) {
  return {
    candidateId: c._id,
    userId: c.userId?._id || c.userId,
    displayName: c.displayName,
    positionTitle: c.positionId?.title,
    manifesto: c.manifesto || '',
    tagline: c.tagline || '',
    election: c.electionId,
    photoUrl: photoUrlForCandidate(c._id, c.userId?.studentId),
  };
}

async function findCandidateMatches(q, phase) {
  const filter = { isActive: true };
  if (q) {
    const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
    filter.displayName = regex;
  }

  const candidates = await Candidate.find(filter)
    .populate('electionId', 'title status startTime endTime settings')
    .populate('positionId', 'title')
    .populate('userId', 'studentId')
    .limit(q ? 30 : 120)
    .sort({ displayName: 1 });

  const rows = candidates
    .filter((c) => c.electionId && PUBLIC_STATUSES.includes(c.electionId.status))
    .filter((c) => !phase || phase === 'all' || filterElectionsByPhase([c.electionId], phase).length > 0)
    .map(mapCandidateRow);

  return groupCandidateMatches(rows);
}

async function searchElections({ q, phase, includeDraft = false }) {
  const baseFilter = includeDraft
    ? {}
    : { status: { $in: PUBLIC_STATUSES } };

  let elections;
  if (q) {
    try {
      elections = await Election.find(
        { ...baseFilter, $text: { $search: q } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);
    } catch {
      elections = [];
    }

    if (elections.length === 0) {
      const regex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
      elections = await Election.find({
        ...baseFilter,
        $or: [{ title: regex }, { description: regex }],
      })
        .sort({ startTime: -1 })
        .limit(50);
    }
  } else {
    elections = await Election.find(baseFilter).sort({ startTime: -1 }).limit(50);
  }

  elections = filterElectionsByPhase(elections, phase);

  const candidateMatches = await findCandidateMatches(q, phase);

  return { elections, candidateMatches, query: q || '' };
}

module.exports = {
  filterElectionsByPhase,
  findCandidateMatches,
  searchElections,
  PUBLIC_STATUSES,
};
