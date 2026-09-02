import api from './api';
import { getElectionPhase, phaseLabel } from '../utils/electionHelpers';

export const STATIC_PAGES = [
  { id: 'home', label: 'Home', path: '/', subtitle: 'Tile dashboard', keywords: ['home', 'start', 'tiles', 'dashboard'] },
  { id: 'vote', label: 'My Ballots', path: '/my-ballots', subtitle: 'Cast your official vote', keywords: ['vote', 'ballot', 'cast'] },
  { id: 'elections', label: 'Elections', path: '/elections', subtitle: 'Browse campus elections', keywords: ['election', 'browse', 'search'] },
  { id: 'polls', label: 'Public Polls', path: '/polls', subtitle: 'Prediction polls (not official)', keywords: ['poll', 'prediction', 'opinion'] },
  { id: 'results', label: 'Live Results', path: '/live', subtitle: 'Real-time vote counts', keywords: ['result', 'live', 'score', 'standings'] },
  { id: 'calendar', label: 'Election Calendar', path: '/calendar', subtitle: 'Key dates and deadlines', keywords: ['calendar', 'date', 'schedule'] },
  { id: 'apply', label: 'Run as Candidate', path: '/apply', subtitle: 'Apply for a position', keywords: ['apply', 'candidate', 'run', 'campaign'] },
  { id: 'verify', label: 'Verify Receipt', path: '/verify-receipt', subtitle: 'Confirm your ballot', keywords: ['receipt', 'verify', 'proof'] },
  { id: 'help', label: 'Help & FAQ', path: '/help', subtitle: 'Voting guidance', keywords: ['help', 'faq', 'support'] },
  { id: 'dashboard', label: 'Voter Dashboard', path: '/dashboard', subtitle: 'Your voter hub', keywords: ['dashboard', 'hub'] },
];

function filterStaticPages(q) {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];
  return STATIC_PAGES.filter(
    (p) => p.label.toLowerCase().includes(lower)
      || p.subtitle.toLowerCase().includes(lower)
      || p.keywords.some((k) => k.includes(lower) || lower.includes(k)),
  );
}

export async function searchElectionsAndCandidates(q, { authenticated = false, phase } = {}) {
  const trimmed = q?.trim();
  const params = { phase: phase === 'all' ? undefined : phase };
  if (trimmed) params.q = trimmed;

  const endpoint = authenticated ? '/elections/search' : '/elections/public/search';
  const res = await api.get(endpoint, { params });
  const elections = (res.data.elections || []).filter((e) => e.status !== 'draft');
  return { elections, candidateMatches: res.data.candidateMatches || [] };
}

export async function searchResultsPage(q, phase) {
  const trimmed = q?.trim();
  if (!trimmed) return { elections: [], candidateMatches: [] };
  const res = await api.get('/results/search', {
    params: { q: trimmed, phase: phase === 'all' ? undefined : phase },
  });
  return {
    elections: res.data.elections || [],
    candidateMatches: res.data.candidateMatches || [],
  };
}

export async function searchPolls(q) {
  const trimmed = q?.trim().toLowerCase();
  if (!trimmed) return [];
  try {
    const res = await api.get('/polls', { params: { status: 'active' } });
    const polls = res.data.polls || [];
    return polls.filter(
      (p) => p.title?.toLowerCase().includes(trimmed)
        || p.description?.toLowerCase().includes(trimmed),
    ).slice(0, 6);
  } catch {
    return [];
  }
}

export async function globalSearch(q, { authenticated = false } = {}) {
  const trimmed = q?.trim();
  if (!trimmed) {
    return { pages: [], elections: [], candidates: [], polls: [] };
  }

  const [electionData, polls] = await Promise.all([
    searchElectionsAndCandidates(trimmed, { authenticated }).catch(() => ({ elections: [], candidateMatches: [] })),
    searchPolls(trimmed),
  ]);

  return {
    pages: filterStaticPages(trimmed),
    elections: electionData.elections.slice(0, 6),
    candidates: electionData.candidateMatches.slice(0, 6),
    polls,
  };
}

export async function adminSearch(q) {
  const trimmed = q?.trim();
  if (!trimmed) {
    return { users: [], candidates: [], applications: [], elections: [] };
  }
  const [users, candidates, applications, elections] = await Promise.all([
    api.get('/admin/users/search', { params: { q: trimmed } }),
    api.get('/admin/candidates/search', { params: { q: trimmed } }),
    api.get('/applications/search', { params: { q: trimmed } }),
    api.get('/elections/search', { params: { q: trimmed } }),
  ]);
  return {
    users: users.data.users || [],
    candidates: candidates.data.candidates || [],
    applications: applications.data.applications || [],
    elections: (elections.data.elections || []).filter((e) => e.status !== 'draft'),
  };
}

export function electionResultMeta(election) {
  const phase = getElectionPhase(election);
  return { phase, phaseLabel: phaseLabel(phase) };
}
