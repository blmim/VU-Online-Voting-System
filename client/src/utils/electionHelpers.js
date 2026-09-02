export function getElectionPhase(election) {
  const now = Date.now();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (['closed', 'certified'].includes(election.status)) return 'finished';
  if (now < start) return 'upcoming';
  if (now >= start && now <= end && ['published', 'active'].includes(election.status)) return 'active';
  if (now > end) return 'finished';
  return 'other';
}

export function isVotingOpen(election) {
  return getElectionPhase(election) === 'active';
}

export function phaseLabel(phase) {
  const labels = {
    active: 'Voting open',
    upcoming: 'Upcoming',
    finished: 'Finished',
    other: 'Scheduled',
  };
  return labels[phase] || phase;
}

export function phaseColor(phase) {
  if (phase === 'active') return 'success';
  if (phase === 'upcoming') return 'info';
  if (phase === 'finished') return 'default';
  return 'warning';
}

export function formatElectionDates(start, end) {
  const opts = { dateStyle: 'medium', timeStyle: 'short' };
  return `${new Date(start).toLocaleString(undefined, opts)} — ${new Date(end).toLocaleString(undefined, opts)}`;
}

export function filterElectionsByPhase(elections, phase) {
  if (!phase || phase === 'all') return elections;
  return elections.filter((e) => getElectionPhase(e) === phase);
}
