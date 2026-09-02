const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'strong', 'leader', 'leadership', 'trust', 'hope', 'win', 'best', 'support',
  'confident', 'impressive', 'experienced', 'experience', 'capable', 'inspiring', 'solid', 'change',
  'communication', 'transparent', 'integrity', 'passion', 'dedicated', 'qualified',
];
const NEGATIVE_KEYWORDS = [
  'weak', 'bad', 'lose', 'doubt', 'concern', 'worried', 'against', 'poor', 'unlikely',
  'disappoint', 'risk', 'unprepared', 'untrust', 'corrupt',
];
const THEME_KEYWORDS = [
  'leadership', 'experience', 'trust', 'change', 'communication', 'transparency', 'events',
  'wellbeing', 'inclusion', 'technology', 'advocacy', 'mentoring', 'community', 'innovation',
];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function keywordSentiment(text) {
  const lower = String(text || '').toLowerCase();
  let score = 0;
  for (const w of POSITIVE_KEYWORDS) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE_KEYWORDS) if (lower.includes(w)) score -= 1;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function extractThemes(texts) {
  const counts = {};
  for (const theme of THEME_KEYWORDS) counts[theme] = 0;

  for (const text of texts) {
    const lower = String(text || '').toLowerCase();
    for (const theme of THEME_KEYWORDS) {
      if (lower.includes(theme)) counts[theme] += 1;
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([theme, count]) => ({
      theme,
      count,
      pct: Math.round((count / total) * 100),
    }));
}

function buildCandidateInsights(candidates, allTexts) {
  const totalComments = allTexts.length || 1;

  return candidates.map((c) => {
    const name = c.displayName || '';
    const nameLower = name.toLowerCase();
    const firstName = name.split(' ')[0]?.toLowerCase() || '';

    const mentionTexts = allTexts.filter((t) => {
      const lower = t.toLowerCase();
      return lower.includes(nameLower) || (firstName.length > 2 && lower.includes(firstName));
    });

    const positive = mentionTexts.filter((t) => keywordSentiment(t) === 'positive').length;
    const negative = mentionTexts.filter((t) => keywordSentiment(t) === 'negative').length;
    const mentionPct = Math.round((mentionTexts.length / totalComments) * 100);

    const profileText = [
      c.tagline, c.bio, c.whyRunning, c.inspiration, c.goals, c.experience, c.speech, c.manifesto,
    ].filter(Boolean).join(' ');
    const profileTokens = new Set(tokenize(profileText));

    const matchedThemes = [];
    for (const theme of THEME_KEYWORDS) {
      const inComments = mentionTexts.some((t) => t.toLowerCase().includes(theme));
      const inProfile = profileTokens.has(theme) || profileText.toLowerCase().includes(theme);
      if (inComments || inProfile) matchedThemes.push(theme);
    }

    const themesStr = matchedThemes.slice(0, 3).join(', ') || 'general campus issues';
    let summary = '';
    if (mentionTexts.length === 0) {
      summary = `${name} has limited discussion mentions so far — voters may learn more from their profile.`;
    } else if (positive > negative) {
      summary = `Voters mention ${name}'s ${themesStr} most often (${mentionPct}% of comments).`;
    } else if (negative > positive) {
      summary = `${name} is discussed with mixed sentiment — ${themesStr} come up frequently.`;
    } else {
      summary = `${name} is discussed for ${themesStr} (${mentionPct}% of comments).`;
    }

    let supportReason = '';
    if (c.whyRunning) {
      const snippet = c.whyRunning.split(/[.!?]/)[0]?.trim();
      supportReason = snippet
        ? `Top reason voters support ${name.split(' ')[0]}: "${snippet.slice(0, 120)}${snippet.length > 120 ? '…' : ''}"`
        : '';
    }

    return {
      candidateId: c._id,
      displayName: name,
      photoUrl: c.photoUrl,
      mentionCount: mentionTexts.length,
      mentionPct,
      positiveMentions: positive,
      negativeMentions: negative,
      matchedThemes: matchedThemes.slice(0, 5),
      summary,
      supportReason,
    };
  });
}

function buildFeedbackAnalysis({ candidates, discussionComments, pollComments }) {
  const discussionTexts = (discussionComments || []).map((c) => c.body || c.content || '');
  const pollTexts = (pollComments || []).map((c) => c.content || c.body || '');
  const allTexts = [...discussionTexts, ...pollTexts].filter(Boolean);

  const themes = extractThemes(allTexts);
  const candidateInsights = buildCandidateInsights(candidates, allTexts);

  const paragraphs = [];
  if (allTexts.length === 0) {
    paragraphs.push('No public discussion yet — be the first to share your thoughts in the election forum or poll comments.');
  } else {
    const topTheme = themes[0];
    if (topTheme) {
      paragraphs.push(`The community is talking most about ${topTheme.theme} (${topTheme.pct}% of themed mentions).`);
    }
    const leader = [...candidateInsights].sort((a, b) => b.mentionCount - a.mentionCount)[0];
    if (leader?.mentionCount > 0) {
      paragraphs.push(leader.summary);
    }
    const second = candidateInsights.find((c) => c.candidateId !== leader?.candidateId && c.mentionCount > 0);
    if (second) paragraphs.push(second.summary);
  }

  const wordCloud = themes.slice(0, 12).map((t) => ({ word: t.theme, weight: t.count }));

  return {
    totalComments: allTexts.length,
    discussionCount: discussionTexts.length,
    pollCommentCount: pollTexts.length,
    themes,
    wordCloud,
    candidateInsights,
    summaryParagraphs: paragraphs,
    disclaimer: 'Community Insights are generated from public discussion and poll comments using rule-based analysis — not a live AI service.',
  };
}

module.exports = {
  buildFeedbackAnalysis,
  keywordSentiment,
  extractThemes,
};
