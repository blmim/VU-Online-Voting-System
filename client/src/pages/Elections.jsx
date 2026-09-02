import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, Stack, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BallotIcon from '@mui/icons-material/Ballot';
import GroupsIcon from '@mui/icons-material/Groups';
import api from '../services/api';
import ElectionCard from '../components/ElectionCard';
import CandidateBrowseCard from '../components/CandidateBrowseCard';
import LiveSearchDropdown from '../components/LiveSearchDropdown';
import SecureTabs from '../components/SecureTabs';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { searchElectionsAndCandidates } from '../services/searchService';
import { addRecentSearch } from '../utils/recentSearches';
import { getElectionPhase } from '../utils/electionHelpers';
import { VU_GOLD, VU_NAVY } from '../theme';
import { useAuth } from '../context/AuthContext';

const VIEW_TABS = [
  { value: 'elections', label: 'Elections', icon: <BallotIcon fontSize="small" />, tooltip: 'Browse and search elections' },
  { value: 'candidates', label: 'Candidates', icon: <GroupsIcon fontSize="small" />, tooltip: 'Browse and search candidates' },
];

const PHASE_TABS = [
  { value: 'all', label: 'All', tooltip: 'Show all items in this category' },
  { value: 'active', label: 'Voting open', tooltip: 'Elections with voting open now' },
  { value: 'upcoming', label: 'Upcoming', tooltip: 'Elections starting soon' },
  { value: 'finished', label: 'Finished', tooltip: 'Closed or certified elections' },
];

export default function Elections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'candidates' ? 'candidates' : 'elections';

  const [view, setView] = useState(initialView);
  const [elections, setElections] = useState([]);
  const [search, setSearch] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [error, setError] = useState('');
  const [voteStatus, setVoteStatus] = useState({});
  const [candidateMatches, setCandidateMatches] = useState([]);
  const [highlightId, setHighlightId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const voteStatusReq = useRef(0);

  useEffect(() => {
    const paramView = searchParams.get('view') === 'candidates' ? 'candidates' : 'elections';
    setView(paramView);
  }, [searchParams]);

  const handleViewChange = (_, next) => {
    setView(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next === 'candidates') p.set('view', 'candidates');
      else p.delete('view');
      return p;
    }, { replace: true });
  };

  const loadVoteStatus = useCallback(async (list, requestId) => {
    if (!user) return;
    const statusMap = {};
    await Promise.all(
      list.slice(0, 20).map(async (e) => {
        try {
          const detail = await api.get(`/elections/${e._id}`);
          if (voteStatusReq.current !== requestId) return;
          statusMap[e._id] = detail.data.hasVoted;
        } catch {
          if (voteStatusReq.current !== requestId) return;
          statusMap[e._id] = false;
        }
      }),
    );
    if (voteStatusReq.current !== requestId) return;
    setVoteStatus(statusMap);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDropdownLoading(!!debouncedSearch.trim());
    setError('');
    searchElectionsAndCandidates(debouncedSearch, { authenticated: !!user, phase: tab })
      .then((data) => {
        if (cancelled) return;
        setElections(data.elections);
        setCandidateMatches(data.candidateMatches);
        setSubmittedQuery(debouncedSearch.trim());
        const reqId = ++voteStatusReq.current;
        loadVoteStatus(data.elections, reqId);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load results. Please try again.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setDropdownLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [debouncedSearch, tab, user, loadVoteStatus]);

  const handleClear = () => {
    setSearch('');
    setSubmittedQuery('');
    setHighlightId('');
    setDropdownOpen(false);
  };

  const handleSelectElection = (e) => {
    addRecentSearch({ label: e.title, path: `/elections/${e._id}`, type: 'election' });
    setDropdownOpen(false);
    navigate(`/elections/${e._id}`);
  };

  const handleSelectCandidate = (m) => {
    addRecentSearch({ label: m.displayName, path: `/candidates/${m.candidateId}`, type: 'candidate' });
    setDropdownOpen(false);
    if (m.candidateId) {
      navigate(`/candidates/${m.candidateId}`);
    }
  };

  const electionCounts = useMemo(() => ({
    active: elections.filter((e) => getElectionPhase(e) === 'active').length,
    upcoming: elections.filter((e) => getElectionPhase(e) === 'upcoming').length,
    finished: elections.filter((e) => getElectionPhase(e) === 'finished').length,
  }), [elections]);

  const candidateCounts = useMemo(() => ({
    active: candidateMatches.filter((c) => getElectionPhase(c.election) === 'active').length,
    upcoming: candidateMatches.filter((c) => getElectionPhase(c.election) === 'upcoming').length,
    finished: candidateMatches.filter((c) => getElectionPhase(c.election) === 'finished').length,
  }), [candidateMatches]);

  const counts = view === 'candidates' ? candidateCounts : electionCounts;
  const isCandidateView = view === 'candidates';
  const resultCount = isCandidateView ? candidateMatches.length : elections.length;
  const resultLabel = isCandidateView ? 'candidate' : 'election';

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `3px solid ${VU_GOLD}`,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Campus Elections
        </Typography>
        <Typography sx={{ opacity: 0.9, maxWidth: 720, mb: 2 }}>
          {isCandidateView
            ? 'Browse candidates by election phase — search by name, position, or filter by voting status.'
            : 'Search elections by name or description — switch to Candidates to browse profiles.'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${counts.active} open`} sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 600 }} />
          <Chip label={`${counts.upcoming} upcoming`} sx={{ bgcolor: 'info.main', color: 'white' }} />
          <Chip label={`${counts.finished} finished`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
        </Stack>
      </Box>

      <SecureTabs
        value={view}
        onChange={handleViewChange}
        tabs={VIEW_TABS}
        aria-label="Browse elections or candidates"
        sx={{ mb: 2 }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <LiveSearchDropdown
          value={search}
          onChange={setSearch}
          onClear={handleClear}
          placeholder={isCandidateView ? 'Search candidates by name…' : 'Search elections or candidates…'}
          elections={isCandidateView ? [] : elections}
          candidateMatches={candidateMatches}
          loading={dropdownLoading && !!search.trim()}
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          onSelectElection={handleSelectElection}
          onSelectCandidate={handleSelectCandidate}
        />
        {user && (
          <Button component={Link} to="/my-ballots" variant="outlined" startIcon={<HowToVoteIcon />}>
            Vote now
          </Button>
        )}
      </Stack>

      <SecureTabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        tabs={PHASE_TABS}
        aria-label={isCandidateView ? 'Filter candidates by election phase' : 'Filter elections by status'}
      />

      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {resultCount} {resultLabel}{resultCount === 1 ? '' : 's'}
          {submittedQuery ? ` matching "${submittedQuery}"` : ''}
          {tab !== 'all' ? ` · ${PHASE_TABS.find((t) => t.value === tab)?.label}` : ''}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label={isCandidateView ? 'Loading candidates' : 'Loading elections'} />
        </Box>
      ) : isCandidateView ? (
        candidateMatches.length === 0 ? (
          <Alert severity="info">
            No candidates match your filters.
            {submittedQuery && (
              <>
                {' '}Try a different name or{' '}
                <Button size="small" onClick={handleClear}>clear search</Button>.
              </>
            )}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {candidateMatches.map((c) => (
              <Grid item xs={12} sm={6} lg={4} key={c.candidateId || `${c.displayName}-${c.election?._id}`}>
                <CandidateBrowseCard candidate={c} />
              </Grid>
            ))}
          </Grid>
        )
      ) : elections.length === 0 ? (
        <Alert severity="info">
          No elections match your search.
          {submittedQuery && (
            <>
              {' '}Try a different keyword or{' '}
              <Button size="small" onClick={handleClear}>clear filters</Button>.
            </>
          )}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {elections.map((e) => (
            <Grid item xs={12} sm={6} lg={4} key={e._id} id={`election-${e._id}`}>
              <Box
                sx={{
                  borderRadius: 2,
                  outline: highlightId === e._id ? `2px solid ${VU_GOLD}` : 'none',
                  transition: 'outline 0.2s',
                }}
              >
                <ElectionCard
                  election={e}
                  hasVoted={voteStatus[e._id]}
                  showVote={!!user}
                  canVote={!!user && user.isVerified !== false}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
