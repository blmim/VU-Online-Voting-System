import ChampionshipScoreboard from './ChampionshipScoreboard';

function getLeaders(positions) {
  return (positions || []).map((pos) => {
    const seats = pos.seats || 1;
    const sorted = [...(pos.candidates || [])].sort((a, b) => b.voteCount - a.voteCount);
    const leaders = sorted.slice(0, seats);
    const total = pos.totalVotes || sorted.reduce((s, c) => s + (c.voteCount || 0), 0);
    return { position: pos, leaders, total, seats };
  });
}

export default function LeadingCandidates({ positions }) {
  const leadersByPosition = getLeaders(positions);
  if (!leadersByPosition.length) return null;

  const top = leadersByPosition[0];
  return (
    <ChampionshipScoreboard
      title={top.position.title}
      subtitle={`${top.total} votes cast · ${top.seats} seat${top.seats > 1 ? 's' : ''}`}
      fighters={top.position.candidates || []}
    />
  );
}
