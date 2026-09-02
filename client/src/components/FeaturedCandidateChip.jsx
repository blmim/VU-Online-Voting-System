import { Link } from 'react-router-dom';
import { Avatar, Box, Typography } from '@mui/material';
import CandidatePositionBadges from './CandidatePositionBadges';
import { VU_GOLD } from '../theme';

export default function FeaturedCandidateChip({ candidate }) {
  const profileId = candidate.candidateId || candidate._id;

  return (
    <Box
      component={Link}
      to={`/candidates/${profileId}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.75,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 4px 14px rgba(0,51,102,0.12)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Avatar
        src={candidate.photoUrl || undefined}
        alt=""
        sx={{ width: 32, height: 32, border: `2px solid ${VU_GOLD}` }}
      />
      <Box>
        <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
          {candidate.displayName}
        </Typography>
        <CandidatePositionBadges positions={candidate.positions} />
      </Box>
    </Box>
  );
}
