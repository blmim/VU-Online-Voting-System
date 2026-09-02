import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Grid, Stack, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import api from '../services/api';
import PageHero from '../components/PageHero';
import DiscussionSection from '../components/DiscussionSection';
import InsightsPanel from '../components/InsightsPanel';
import ChampionshipScoreboard from '../components/ChampionshipScoreboard';
import InteractiveVoteLineChart from '../components/InteractiveVoteLineChart';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbOverride } from '../context/BreadcrumbContext';
import CandidatePositionBadges from '../components/CandidatePositionBadges';
import SecureTabs from '../components/SecureTabs';
import { groupCandidatesByUser } from '../utils/candidateHelpers';
import { VU_GOLD } from '../theme';
import { isVotingOpen } from '../utils/electionHelpers';

const HUB_TABS = [
  { value: 'overview', label: 'Overview', tooltip: 'Live standings and vote timeline' },
  { value: 'candidates', label: 'Candidates', tooltip: 'Profiles and manifestos' },
  { value: 'discussion', label: 'Discussion', tooltip: 'Public community forum' },
  { value: 'insights', label: 'Insights', tooltip: 'AI analysis of voter sentiment' },
  { value: 'polls', label: 'Polls', tooltip: 'Prediction polls for this election' },
];

const TABS = HUB_TABS.map((t) => t.value);

export default function ElectionHub() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const tabParam = searchParams.get('tab') || 'overview';
  const tab = TABS.includes(tabParam) ? tabParam : 'overview';

  const [election, setElection] = useState(null);
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [polls, setPolls] = useState([]);
  const [discussion, setDiscussion] = useState([]);
  const [insights, setInsights] = useState(null);
  const [liveResults, setLiveResults] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setOverride } = useBreadcrumbOverride();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pubRes, candRes, discRes, insRes] = await Promise.allSettled([
        api.get(`/elections/${id}/public`),
        api.get(`/elections/${id}/candidates`),
        api.get(`/elections/${id}/discussion`),
        api.get(`/elections/${id}/insights`),
      ]);

      if (pubRes.status !== 'fulfilled') {
        throw pubRes.reason;
      }

      setElection(pubRes.value.data.election);
      setPositions(pubRes.value.data.positions || []);
      setPolls(pubRes.value.data.polls || []);

      if (candRes.status === 'fulfilled') {
        setCandidates(candRes.value.data.groupedCandidates?.length
          ? candRes.value.data.groupedCandidates
          : groupCandidatesByUser(candRes.value.data.candidates || []));
      } else {
        setCandidates([]);
      }

      if (discRes.status === 'fulfilled') {
        setDiscussion(discRes.value.data.comments || []);
      } else {
        setDiscussion([]);
      }

      if (insRes.status === 'fulfilled') {
        setInsights(insRes.value.data.analysis);
      } else {
        setInsights(null);
      }

      try {
        const live = await api.get(`/results/live/${id}`);
        setLiveResults(live.data);
      } catch {
        setLiveResults(null);
      }
      try {
        const tl = await api.get(`/results/live/${id}/timeline`);
        setTimeline(tl.data);
      } catch {
        setTimeline(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load election');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!election) return undefined;
    const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
    setOverride([
      { to: '/', label: 'Home', icon: HomeIcon, tooltip: 'Go to Home' },
      { to: '/elections', label: 'Elections', icon: HowToVoteIcon, tooltip: 'Go to Elections' },
      ...(tab !== 'overview'
        ? [{ to: `/elections/${id}`, label: election.title, icon: HowToVoteIcon }]
        : [{ label: election.title, icon: HowToVoteIcon }]),
      ...(tab !== 'overview' ? [{ label: tabLabel, icon: InfoIcon }] : []),
    ]);
    return () => setOverride(null);
  }, [election, tab, id, setOverride]);

  const setTab = (_, v) => setSearchParams({ tab: v });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading election" />
      </Box>
    );
  }

  if (error || !election) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Election not found'}</Alert>
        <Button component={Link} to="/elections" startIcon={<ArrowBackIcon />}>Back to elections</Button>
      </Box>
    );
  }

  const topPosition = liveResults?.positions?.[0];

  return (
    <Box>
      <Button component={Link} to="/elections" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>All elections</Button>

      <PageHero title={election.title} subtitle={election.description}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Chip label={election.status} sx={{ bgcolor: VU_GOLD, color: 'primary.main', fontWeight: 700 }} />
          <CountdownTimer endDate={election.endTime} label="Voting closes in" />
          {user && isVotingOpen(election) && (
            <Button component={Link} to={`/vote/${id}`} variant="contained" color="secondary" size="small" startIcon={<HowToVoteIcon />}>
              Vote now
            </Button>
          )}
        </Stack>
      </PageHero>

      <SecureTabs
        value={tab}
        onChange={setTab}
        tabs={HUB_TABS}
        sx={{ mb: 3 }}
        aria-label="Election hub sections"
      />

      {tab === 'overview' && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {topPosition && (
              <Box sx={{ mb: 3 }}>
                <ChampionshipScoreboard
                  title={topPosition.title}
                  subtitle="Live championship standings"
                  fighters={topPosition.candidates}
                />
              </Box>
            )}
            {timeline?.positions?.[0] && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <InteractiveVoteLineChart
                    title="Vote momentum over time"
                    timeline={timeline.positions[0].timeline}
                    candidates={timeline.positions[0].candidates}
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Positions</Typography>
                {positions.map((p) => (
                  <Box key={p._id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography fontWeight={600}>{p.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <InsightsPanel analysis={insights} />
          </Grid>
        </Grid>
      )}

      {tab === 'candidates' && (
        <Grid container spacing={2}>
          {candidates.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.userId || c.candidateId || c._id}>
              <Card sx={{ height: '100%', borderTop: `4px solid ${VU_GOLD}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar src={c.photoUrl || undefined} alt="" sx={{ width: 72, height: 72, border: `2px solid ${VU_GOLD}` }} />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{c.displayName}</Typography>
                      <CandidatePositionBadges positions={c.positions} size="medium" />
                    </Box>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {c.tagline || c.manifesto?.slice(0, 120)}
                  </Typography>
                  <Button component={Link} to={`/candidates/${c.candidateId || c._id}`} variant="outlined" fullWidth>
                    View full profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 'discussion' && (
        <DiscussionSection electionId={id} comments={discussion} onRefresh={load} />
      )}

      {tab === 'insights' && (
        <InsightsPanel analysis={insights} />
      )}

      {tab === 'polls' && (
        <Box>
          {polls.length === 0 ? (
            <Alert severity="info">No polls linked to this election yet.</Alert>
          ) : (
            polls.map((p) => (
              <Card key={p._id} sx={{ mb: 2 }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography fontWeight={700}>{p.title}</Typography>
                    <Chip label={p.status} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Button component={Link} to={`/polls/${p._id}`} variant="contained">Open poll</Button>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
