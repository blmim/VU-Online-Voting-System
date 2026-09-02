import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import api from '../services/api';
import PageHero from '../components/PageHero';
import { getElectionPhase, phaseColor, phaseLabel } from '../utils/electionHelpers';
import { VU_GOLD, VU_NAVY } from '../theme';

function TimelineItem({ election, isLast }) {
  const phase = getElectionPhase(election);
  return (
    <Box sx={{ display: 'flex', gap: 2, pb: isLast ? 0 : 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: phase === 'active' ? VU_GOLD : VU_NAVY,
            border: `2px solid ${VU_GOLD}`,
            flexShrink: 0,
          }}
        />
        {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: 'grey.300', mt: 0.5 }} />}
      </Box>
      <Card sx={{ flex: 1 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Typography variant="subtitle1" fontWeight={700}>{election.title}</Typography>
            <Chip label={phaseLabel(phase)} size="small" color={phaseColor(phase)} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {new Date(election.startTime).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' — '}
            {new Date(election.endTime).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            {phase === 'active' && (
              <Button component={Link} to="/my-ballots" size="small" variant="contained" startIcon={<HowToVoteIcon />}>
                Vote
              </Button>
            )}
            <Button component={Link} to={`/live/${election._id}`} size="small" variant="outlined" startIcon={<LiveTvIcon />}>
              Results
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ElectionCalendar() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/elections/public')
      .then((r) => {
        const sorted = (r.data.elections || []).sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        );
        setElections(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <PageHero
        title="Election calendar"
        subtitle="Timeline of campus elections — past, present, and upcoming."
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading calendar" />
        </Box>
      ) : elections.length === 0 ? (
        <Alert severity="info" icon={<EventIcon />}>No elections scheduled yet.</Alert>
      ) : (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          {elections.map((e, i) => (
            <TimelineItem key={e._id} election={e} isLast={i === elections.length - 1} />
          ))}
        </Box>
      )}

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button component={Link} to="/elections" variant="outlined">Browse all elections</Button>
      </Box>
    </Box>
  );
}
