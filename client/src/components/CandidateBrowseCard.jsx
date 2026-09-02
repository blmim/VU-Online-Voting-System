import { Link } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CandidatePositionBadges from './CandidatePositionBadges';
import { getElectionPhase, phaseColor, phaseLabel } from '../utils/electionHelpers';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function CandidateBrowseCard({ candidate }) {
  const profileId = candidate.candidateId || candidate._id;
  const election = candidate.election;
  const phase = election ? getElectionPhase(election) : 'active';
  const snippet = candidate.tagline || candidate.manifesto?.slice(0, 120) || '';

  return (
    <Card
      className="vu-premium-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `4px solid ${VU_GOLD}`,
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            src={candidate.photoUrl || undefined}
            alt=""
            sx={{
              width: 64,
              height: 64,
              border: `3px solid ${VU_GOLD}`,
              bgcolor: VU_NAVY,
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component={Link}
              to={`/candidates/${profileId}`}
              fontWeight={700}
              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {candidate.displayName}
            </Typography>
            <CandidatePositionBadges positions={candidate.positions} />
          </Box>
        </Stack>

        {snippet && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {snippet}{candidate.manifesto?.length > 120 ? '…' : ''}
          </Typography>
        )}

        {election && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip label={phaseLabel(phase)} size="small" color={phaseColor(phase)} />
            <Chip label={election.title} size="small" variant="outlined" />
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1 }}>
          <Button
            component={Link}
            to={`/candidates/${profileId}`}
            variant="contained"
            size="small"
            fullWidth
          >
            View profile
          </Button>
          {election && (
            <Button
              component={Link}
              to={`/elections/${election._id}`}
              variant="outlined"
              size="small"
              startIcon={<HowToVoteIcon />}
            >
              Election
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
