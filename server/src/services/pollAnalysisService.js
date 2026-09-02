const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'strong', 'leader', 'trust', 'hope', 'win', 'best', 'support',
  'confident', 'impressive', 'experienced', 'capable', 'inspiring', 'solid',
];
const NEGATIVE_KEYWORDS = [
  'weak', 'bad', 'lose', 'doubt', 'concern', 'worried', 'against', 'poor', 'unlikely',
  'disappoint', 'risk', 'unprepared',
];

function keywordSentiment(text) {
  const lower = String(text || '').toLowerCase();
  let score = 0;
  for (const w of POSITIVE_KEYWORDS) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE_KEYWORDS) if (lower.includes(w)) score -= 1;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function buildPollResults(poll, votes) {
  const totalVotes = votes.length;
  const counts = new Map(poll.options.map((o) => [String(o._id), 0]));

  for (const v of votes) {
    const key = String(v.optionId);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }

  const results = poll.options.map((opt) => {
    const voteCount = counts.get(String(opt._id)) || 0;
    const votePct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0;
    return {
      optionId: opt._id,
      displayName: opt.displayName,
      photoUrl: opt.photoUrl,
      manifesto: opt.manifesto,
      voteCount,
      votePct,
    };
  });

  results.sort((a, b) => b.voteCount - a.voteCount);

  const leader = results[0] || null;
  const runnerUp = results[1] || null;
  const margin = leader && runnerUp && totalVotes > 0
    ? Math.round(((leader.voteCount - runnerUp.voteCount) / totalVotes) * 1000) / 10
    : 0;

  return { results, totalVotes, leader, runnerUp, margin };
}

function analyzeComments(comments, results) {
  const nameToOption = new Map(results.map((r) => [r.displayName.toLowerCase(), r]));

  const mentions = {};
  for (const r of results) {
    mentions[r.displayName] = { positive: 0, negative: 0, neutral: 0 };
  }

  for (const c of comments) {
    const sentiment = keywordSentiment(c.content);
    const lower = c.content.toLowerCase();
    for (const r of results) {
      if (lower.includes(r.displayName.toLowerCase())) {
        mentions[r.displayName][sentiment] += 1;
      }
    }
  }

  const sentimentSummary = results.map((r) => {
    const m = mentions[r.displayName];
    const total = m.positive + m.negative + m.neutral;
    const dominant = m.positive >= m.negative && m.positive >= m.neutral
      ? 'positive'
      : m.negative > m.positive
        ? 'negative'
        : 'neutral';
    return { displayName: r.displayName, ...m, totalMentions: total, dominant };
  });

  return sentimentSummary;
}

function buildAnalysis(poll, votes, comments) {
  const { results, totalVotes, leader, runnerUp, margin } = buildPollResults(poll, votes);
  const sentimentSummary = analyzeComments(comments, results);

  const reasons = [];
  if (!leader) {
    reasons.push('No votes recorded yet — be the first to predict.');
  } else if (totalVotes < 5) {
    reasons.push('Early poll — results may shift as more people respond.');
  } else if (margin >= 15) {
    reasons.push(`${leader.displayName} holds a comfortable lead (${margin}% margin).`);
  } else if (margin > 0) {
    reasons.push(`Close race — ${leader.displayName} leads by only ${margin} percentage points.`);
  } else {
    reasons.push('Tied or very close — every prediction counts.');
  }

  const leaderSentiment = sentimentSummary.find((s) => s.displayName === leader?.displayName);
  if (leaderSentiment?.dominant === 'positive' && leaderSentiment.totalMentions > 0) {
    reasons.push('Discussion sentiment leans positive toward the current leader.');
  } else if (leaderSentiment?.dominant === 'negative' && leaderSentiment.totalMentions > 0) {
    reasons.push('Comment sentiment shows some skepticism about the leader — watch for shifts.');
  }

  const likelyWinner = leader?.displayName || 'Undecided';
  const confidence = totalVotes < 3 ? 'low' : margin >= 20 ? 'high' : margin >= 8 ? 'medium' : 'low';

  return {
    results,
    totalVotes,
    likelyWinner,
    confidence,
    margin,
    leader: leader ? { displayName: leader.displayName, votePct: leader.votePct, photoUrl: leader.photoUrl } : null,
    runnerUp: runnerUp ? { displayName: runnerUp.displayName, votePct: runnerUp.votePct } : null,
    sentimentSummary,
    insights: reasons,
    disclaimer: 'Public opinion poll — not an official vote. Results reflect predictions only.',
  };
}

module.exports = { buildPollResults, buildAnalysis, keywordSentiment };
