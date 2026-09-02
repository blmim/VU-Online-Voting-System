/**
 * Deduplicate candidate records by _id, then optionally by election+position+user.
 */
function dedupeCandidates(candidates, { byUserPerPosition = true } = {}) {
  if (!candidates?.length) return [];

  const byId = new Map();
  for (const c of candidates) {
    const doc = c.toObject ? c.toObject() : { ...c };
    const id = String(doc._id);
    if (!byId.has(id)) byId.set(id, doc);
  }

  if (!byUserPerPosition) return Array.from(byId.values());

  const bySlot = new Map();
  for (const doc of byId.values()) {
    const key = `${doc.electionId}-${doc.positionId}-${doc.userId}`;
    if (!bySlot.has(key)) bySlot.set(key, doc);
  }
  return Array.from(bySlot.values());
}

/** Dedupe candidate matches by candidateId for search results. */
function dedupeCandidateMatches(matches) {
  if (!matches?.length) return [];
  const seen = new Set();
  return matches.filter((m) => {
    const key = String(m.candidateId || m._id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const POSITION_SORT_RANK = [
  { test: (t) => /^president$/i.test(t) || (/president/i.test(t) && !/vice|deputy/i.test(t)), rank: 0 },
  { test: (t) => /vice[\s-]*president|^vp$/i.test(t), rank: 1 },
  { test: (t) => /secretary/i.test(t), rank: 2 },
  { test: (t) => /treasurer/i.test(t), rank: 3 },
];

function positionSortKey(title) {
  const t = String(title || '').trim();
  const rule = POSITION_SORT_RANK.find((r) => r.test(t));
  if (rule) return rule.rank;
  return 10 + t.toLowerCase();
}

function sortPositionTitles(positions) {
  return [...new Set(positions.filter(Boolean))].sort(
    (a, b) => positionSortKey(a) - positionSortKey(b) || a.localeCompare(b),
  );
}

/**
 * Group enriched candidate records by userId (fallback: displayName).
 * Returns one entry per person with aggregated positions.
 */
function groupCandidatesByUser(candidates) {
  if (!candidates?.length) return [];

  const byUser = new Map();
  for (const c of candidates) {
    const doc = c.toObject ? c.toObject() : { ...c };
    const userKey = doc.userId ? String(doc.userId) : `name:${doc.displayName}`;
    const positionTitle = doc.positionTitle || doc.positionId?.title;
    const existing = byUser.get(userKey);

    if (!existing) {
      byUser.set(userKey, {
        candidateId: doc._id,
        _id: doc._id,
        userId: doc.userId,
        displayName: doc.displayName,
        photoUrl: doc.photoUrl,
        tagline: doc.tagline,
        manifesto: doc.manifesto,
        studentId: doc.studentId,
        profileComplete: doc.profileComplete,
        positions: positionTitle ? [positionTitle] : [],
        candidacies: [{
          candidateId: doc._id,
          positionId: doc.positionId,
          positionTitle,
        }],
      });
    } else {
      if (positionTitle && !existing.positions.includes(positionTitle)) {
        existing.positions.push(positionTitle);
      }
      existing.candidacies.push({
        candidateId: doc._id,
        positionId: doc.positionId,
        positionTitle,
      });
    }
  }

  return Array.from(byUser.values()).map((entry) => ({
    ...entry,
    positions: sortPositionTitles(entry.positions),
  }));
}

/** Group search matches by person within the same election. */
function groupCandidateMatches(matches) {
  if (!matches?.length) return [];

  const byPerson = new Map();
  for (const m of matches) {
    const electionId = String(m.election?._id || m.electionId || '');
    const personKey = `${electionId}-${m.userId || m.displayName}`;
    const positionTitle = m.positionTitle;
    const existing = byPerson.get(personKey);

    if (!existing) {
      byPerson.set(personKey, {
        ...m,
        positions: positionTitle ? [positionTitle] : [],
      });
    } else {
      if (positionTitle && !existing.positions.includes(positionTitle)) {
        existing.positions.push(positionTitle);
      }
    }
  }

  return Array.from(byPerson.values()).map((entry) => ({
    ...entry,
    positions: sortPositionTitles(entry.positions),
  }));
}

module.exports = {
  dedupeCandidates,
  dedupeCandidateMatches,
  groupCandidatesByUser,
  groupCandidateMatches,
  sortPositionTitles,
  positionSortKey,
};
