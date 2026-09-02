import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import BallotIcon from '@mui/icons-material/Ballot';
import PollIcon from '@mui/icons-material/Poll';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import api from '../services/api';
import ElectionCard from '../components/ElectionCard';
import TeamMemberCard from '../components/TeamMemberCard';
import { PROJECT, TEAM } from '../constants/team';
import { getElectionPhase, isVotingOpen } from '../utils/electionHelpers';
import { VU_GOLD, VU_NAVY } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [voteStatus, setVoteStatus] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/elections/search');
      const list = res.data.elections.filter((e) => e.status !== 'draft');
      setElections(list);

      const statusMap = {};
      await Promise.all(
        list.slice(0, 12).map(async (e) => {
          try {
            const detail = await api.get(`/elections/${e._id}`);
            statusMap[e._id] = detail.data.hasVoted;
          } catch {
            statusMap[e._id] = false;
          }
        })
      );
      setVoteStatus(statusMap);
    } catch {
      setError('Failed to load your elections.');
    } finally {
      setLoading(false);
    }
  };

  const openBallots = elections.filter(isVotingOpen);
  const activeElections = elections.filter((e) => getElectionPhase(e) === 'active');

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `3px solid ${VU_GOLD}`,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Voter dashboard
        </Typography>
        <Typography sx={{ opacity: 0.9, maxWidth: 640 }}>
          {user?.fullName
            ? `Welcome back, ${user.fullName.split(' ')[0]} — cast ballots, track open votes, and follow live results.`
            : 'Your home for campus elections — cast ballots, track open votes, and follow live results.'}
        </Typography>
      </Box>

      {user && user.isVerified === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your email is not verified yet. You can browse elections and polls, but official voting requires a verified VU account.
          {' '}<Link to="/profile">View profile</Link>
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <Button component={Link} to="/my-ballots" variant="contained" startIcon={<HowToVoteIcon />}>
          My ballots ({openBallots.length})
        </Button>
        <Button component={Link} to="/elections" variant="outlined" startIcon={<BallotIcon />}>
          Browse elections
        </Button>
        <Button component={Link} to="/polls" variant="outlined" startIcon={<PollIcon />}>
          Public polls
        </Button>
        <Button component={Link} to="/live" variant="outlined" startIcon={<LiveTvIcon />}>
          Live results
        </Button>
        <Button component={Link} to="/apply" variant="outlined">
          Run as candidate
        </Button>
        <Button component={Link} to="/profile" variant="text" startIcon={<PersonOutlineIcon />}>
          Profile
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading elections" />
        </Box>
      ) : (
        <>
          <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
            {activeElections.length > 0 ? 'Elections open for voting' : 'Recent elections'}
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {(activeElections.length > 0 ? activeElections : elections).slice(0, 6).map((e) => (
              <Grid item xs={12} sm={6} md={4} key={e._id}>
                <ElectionCard
                  election={e}
                  hasVoted={voteStatus[e._id]}
                  canVote={user?.isVerified !== false}
                />
              </Grid>
            ))}
            {elections.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No elections are published yet. Check back soon or browse the{' '}
                  <Link to="/elections">elections page</Link>.
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}

      <Card sx={{ borderTop: 3, borderColor: 'secondary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <GroupsIcon color="primary" />
            <Typography variant="h6" component="h2" color="primary" fontWeight={700}>
              {PROJECT.group} development team
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Built for {PROJECT.unit} · {PROJECT.university}
          </Typography>
          <Grid container spacing={2}>
            {TEAM.map((member) => (
              <Grid item xs={12} sm={6} md={3} key={member.slug}>
                <TeamMemberCard member={member} compact />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button component={Link} to="/team" variant="outlined" color="primary" size="small">
              View team profiles
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
