import { sortPositions } from './positionIcons';

/** Client-side fallback when API does not return grouped candidates. */
export function groupCandidatesByUser(candidates = []) {
  const byUser = new Map();

  for (const c of candidates) {
    const userKey = c.userId ? String(c.userId) : `name:${c.displayName}`;
    const positionTitle = c.positionTitle || c.positionId?.title;
    const existing = byUser.get(userKey);

    if (!existing) {
      byUser.set(userKey, {
        ...c,
        candidateId: c.candidateId || c._id,
        positions: positionTitle ? [positionTitle] : (c.positions || []),
      });
    } else {
      const nextPositions = [...existing.positions];
      if (positionTitle && !nextPositions.includes(positionTitle)) {
        nextPositions.push(positionTitle);
      }
      byUser.set(userKey, {
        ...existing,
        positions: sortPositions(nextPositions),
      });
    }
  }

  return Array.from(byUser.values()).map((entry) => ({
    ...entry,
    positions: sortPositions(entry.positions),
  }));
}

export function groupAdminCandidates(candidates = []) {
  const byPerson = new Map();

  for (const c of candidates) {
    const key = String(c.userId?._id || c.userId || c.displayName);
    const positionTitle = c.positionId?.title;
    const existing = byPerson.get(key);

    if (!existing) {
      byPerson.set(key, {
        ...c,
        positions: positionTitle ? [positionTitle] : [],
      });
    } else if (positionTitle && !existing.positions.includes(positionTitle)) {
      existing.positions.push(positionTitle);
    }
  }

  return Array.from(byPerson.values()).map((entry) => ({
    ...entry,
    positions: sortPositions(entry.positions),
  }));
}
