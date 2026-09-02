import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Alert, CircularProgress, Stack,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EventIcon from '@mui/icons-material/Event';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import api from '../services/api';
import { VU_GOLD, VU_NAVY } from '../theme';
import { isVotingOpen } from '../utils/electionHelpers';
import { useAuth } from '../context/AuthContext';

const formatDateRange = (start, end) => {
  const opts = { dateStyle: 'medium', timeStyle: 'short' };
  return `${new Date(start).toLocaleString(undefined, opts)} — ${new Date(end).toLocaleString(undefined, opts)}`;
};

export default function MyBallots() {
  const { user } = useAuth();
  const [ballots, setBallots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBallots();
  }, []);

  const loadBallots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/elections/search');
      const openElections = res.data.elections
        .filter((e) => e.status !== 'draft')
        .filter(isVotingOpen);

      const enriched = await Promise.all(
        openElections.map(async (election) => {
          try {
            const detail = await api.get(`/elections/${election._id}`);
            return {
              ...election,
              positionCount: detail.data.positions?.length ?? 0,
              hasVoted: detail.data.hasVoted ?? false,
            };
          } catch {
            return { ...election, positionCount: null, hasVoted: false };
          }
        }),
      );

      setBallots(enriched);
    } catch {
      setError('Failed to load ballots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `3px solid ${VU_GOLD}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <HowToVoteIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
          <Typography variant="h5" component="h2" fontWeight={700}>
            Vote Now
          </Typography>
        </Stack>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 560 }}>
          Cast your ballot in open elections. Select an election below to begin voting.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {user && user.isVerified === false && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Email verification is required before you can cast an official ballot.
          {' '}<Link to="/profile">Check your account status</Link>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <CircularProgress aria-label="Loading ballots" />
          <Typography color="text.secondary">Loading your ballots…</Typography>
        </Box>
      ) : ballots.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 5, sm: 7 },
            px: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <HowToVoteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No active elections</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            There are no elections open for voting right now. Check the dashboard to browse all elections.
          </Typography>
          <Button
            component={Link}
            to="/dashboard"
            variant="contained"
            startIcon={<SearchIcon />}
          >
            Search Elections on Dashboard
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {ballots.map((election) => (
            <Grid item xs={12} sm={6} lg={4} key={election._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${VU_GOLD}`,
                  '&:hover': { boxShadow: '0 6px 24px rgba(0,51,102,0.14)' },
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ color: 'primary.main' }}>
                    {election.title}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      icon={election.hasVoted ? <CheckCircleOutlineIcon /> : <HowToVoteIcon />}
                      label={election.hasVoted ? 'Already voted' : 'Open'}
                      color={election.hasVoted ? 'default' : 'success'}
                      size="small"
                      sx={election.hasVoted ? { bgcolor: 'grey.100' } : undefined}
                    />
                  </Stack>

                  <Stack spacing={1} sx={{ mb: 2, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <EventIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.25 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDateRange(election.startTime, election.endTime)}
                      </Typography>
                    </Stack>
                    {election.positionCount != null && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WorkspacesIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {election.positionCount} {election.positionCount === 1 ? 'position' : 'positions'}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  <Stack spacing={1}>
                    {user?.isVerified !== false ? (
                      <Button
                        component={Link}
                        to={`/vote/${election._id}`}
                        variant="contained"
                        fullWidth
                        startIcon={<HowToVoteIcon />}
                        aria-label={`Cast vote in ${election.title}`}
                      >
                        {election.hasVoted ? 'Continue ballot' : 'Cast Vote'}
                      </Button>
                    ) : (
                      <Button
                        component={Link}
                        to="/profile"
                        variant="contained"
                        fullWidth
                        color="warning"
                        startIcon={<VerifiedUserIcon />}
                      >
                        Verify email to vote
                      </Button>
                    )}
                    <Button
                      component={Link}
                      to={`/live/${election._id}`}
                      variant="outlined"
                      fullWidth
                      size="small"
                      startIcon={<LiveTvIcon />}
                    >
                      Live Results
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
