import { Link } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, Radio, Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function CandidateBallotCard({
  candidate,
  selected,
  onSelect,
  disabled,
  voted,
}) {
  const initials = candidate.displayName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      variant="outlined"
      sx={{
        borderWidth: 2,
        borderColor: selected ? 'secondary.main' : 'divider',
        bgcolor: selected ? 'rgba(212,175,55,0.08)' : 'background.paper',
        opacity: disabled ? 0.7 : 1,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': disabled ? {} : { boxShadow: '0 4px 16px rgba(0,51,102,0.12)' },
      }}
    >
      <CardActionArea onClick={() => !disabled && !voted && onSelect(candidate._id)} disabled={disabled || voted}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Radio checked={selected} disabled={disabled || voted} sx={{ mt: 0.5 }} />
          <Avatar
            src={candidate.photoUrl || undefined}
            alt=""
            sx={{
              width: 72,
              height: 72,
              bgcolor: VU_NAVY,
              border: `2px solid ${VU_GOLD}`,
            }}
          >
            {initials || <PersonIcon />}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h6" component="h3" fontWeight={700}>
                {candidate.displayName}
              </Typography>
              <Chip label="Candidate" size="small" color="primary" variant="outlined" />
              {candidate.studentId && (
                <Chip label={candidate.studentId} size="small" variant="outlined" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {candidate.manifesto || candidate.tagline || 'No manifesto provided.'}
            </Typography>
            <Button
              component={Link}
              to={`/candidates/${candidate._id}`}
              size="small"
              sx={{ mt: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              View profile
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
