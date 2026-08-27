import {
  Card, CardActionArea, CardContent, Typography, Box, Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getMemberEmail } from '../constants/team';
import TeamAvatar from './TeamAvatar';

export default function TeamMemberCard({ member, compact = false }) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        borderTop: 3,
        borderColor: 'secondary.main',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,51,102,0.15)',
        },
      }}
    >
      <CardActionArea
        component={Link}
        to={`/team/${member.slug}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        aria-label={`View profile for ${member.name}`}
      >
        <CardContent sx={{ flex: 1, textAlign: compact ? 'left' : 'center', p: compact ? 2 : 3 }}>
          <TeamAvatar member={member} compact={compact} />
          <Typography variant={compact ? 'subtitle1' : 'h6'} component="h3" gutterBottom fontWeight={600}>
            {member.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {member.id}
          </Typography>
          <Chip
            label={member.role}
            size="small"
            sx={{ mb: 1, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 500 }}
          />
          {!compact && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
              {member.focus}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: compact ? 'flex-start' : 'center',
              gap: 0.5,
              mt: compact ? 1 : 2,
              color: 'secondary.dark',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              View profile
            </Typography>
            <ArrowForwardIcon fontSize="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function TeamMemberLink({ member, variant = 'link' }) {
  if (variant === 'link') {
    return (
      <Typography
        component={Link}
        to={`/team/${member.slug}`}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          fontWeight: 500,
          '&:hover': { color: 'secondary.main', textDecoration: 'underline' },
        }}
      >
        {member.name}
      </Typography>
    );
  }

  return (
    <Typography variant="body2" component="span">
      <Typography
        component={Link}
        to={`/team/${member.slug}`}
        variant="body2"
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          fontWeight: 500,
          '&:hover': { color: 'secondary.main' },
        }}
      >
        {member.name}
      </Typography>
      {' · '}
      {getMemberEmail(member.id)}
    </Typography>
  );
}
