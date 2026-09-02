import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress,
  Grid, Stack, Typography,
} from '@mui/material';
import PollIcon from '@mui/icons-material/Poll';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import api from '../services/api';
import PageHero from '../components/PageHero';
import { VU_GOLD } from '../theme';

function PollCard({ poll }) {
  const leader = poll.leader;
  const isClosed = poll.status === 'closed' || (poll.closesAt && new Date(poll.closesAt) < new Date());

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `4px solid ${VU_GOLD}`,
        '&:hover': { boxShadow: '0 8px 28px rgba(0,51,102,0.14)' },
      }}
    >
      <CardActionArea component={Link} to={`/polls/${poll._id}`} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardContent sx={{ flex: 1 }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <Chip
              icon={<InfoOutlinedIcon />}
              label="Public opinion — NOT an official vote"
              size="small"
              color="warning"
              variant="outlined"
            />
            <Chip
              label={isClosed ? 'Closed' : 'Active'}
              size="small"
              color={isClosed ? 'default' : 'success'}
            />
          </Stack>

          <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
            {poll.title}
          </Typography>
          {poll.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {poll.description.slice(0, 140)}{poll.description.length > 140 ? '…' : ''}
            </Typography>
          )}

          {poll.electionId?.title && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Linked election:{' '}
              <Link
                to={`/elections/${poll.electionId._id || poll.electionId}`}
                style={{ fontWeight: 600 }}
                onClick={(e) => e.stopPropagation()}
              >
                {poll.electionId.title}
              </Link>
              {' · '}
              <Link
                to={`/live/${poll.electionId._id || poll.electionId}`}
                onClick={(e) => e.stopPropagation()}
              >
                Official results
              </Link>
            </Typography>
          )}

          {leader && (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 'auto' }}>
              {leader.photoUrl && (
                <Avatar src={leader.photoUrl} alt="" sx={{ width: 40, height: 40, border: `2px solid ${VU_GOLD}` }} />
              )}
              <Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EmojiEventsIcon sx={{ fontSize: 16, color: VU_GOLD }} />
                  <Typography variant="caption" color="text.secondary">Current leader</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={700}>{leader.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {leader.votePct}% · {poll.totalVotes || 0} prediction{poll.totalVotes === 1 ? '' : 's'}
                </Typography>
              </Box>
            </Stack>
          )}

          {!leader && (
            <Typography variant="body2" color="text.secondary">
              {poll.totalVotes || 0} prediction{poll.totalVotes === 1 ? '' : 's'} so far — be the first!
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/polls', { params: { status: 'active' } })
      .then((r) => setPolls(r.data.polls || []))
      .catch(() => setError('Could not load prediction polls.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHero
        title="Public Prediction Polls"
        subtitle="Share who you think will win — these are opinion polls only and do not count as official votes."
      >
        <Chip
          icon={<InfoOutlinedIcon />}
          label="Public opinion poll — NOT an official vote"
          sx={{ bgcolor: 'rgba(255,193,7,0.2)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}
        />
      </PageHero>

      <Alert severity="warning" icon={<PollIcon />} sx={{ mb: 3 }}>
        <strong>Disclaimer:</strong> Prediction polls capture public opinion only. Official ballots are cast separately
        through <Link to="/my-ballots">My Ballots</Link> during the voting window.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <CircularProgress aria-label="Loading polls" />
          <Typography color="text.secondary">Loading prediction polls…</Typography>
        </Box>
      ) : polls.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <PollIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No active polls</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Check back when administrators publish prediction polls for upcoming elections.
          </Typography>
          <Button component={Link} to="/elections" variant="outlined">Browse elections</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {polls.map((poll) => (
            <Grid item xs={12} sm={6} md={4} key={poll._id}>
              <PollCard poll={poll} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button component={Link} to="/elections" variant="contained" startIcon={<HowToVoteIcon />}>
          View official elections
        </Button>
      </Box>
    </Box>
  );
}
