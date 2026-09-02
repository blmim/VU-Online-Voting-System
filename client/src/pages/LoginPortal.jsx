import { Box, Typography, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VuLogo from '../components/VuLogo';
import ClickableTooltip from '../components/ClickableTooltip';
import { PROJECT } from '../constants/team';
import { VU_GOLD, VU_NAVY } from '../theme';

const portals = [
  {
    to: '/login/student',
    title: 'Student Login',
    description: 'Sign in with your VU student email to vote, apply as a candidate, and view your dashboard.',
    icon: <HowToVoteIcon sx={{ fontSize: 48 }} />,
    accent: 'secondary.main',
    tooltip: 'Sign in as a student voter',
  },
  {
    to: '/login/admin',
    title: 'Administrator Login',
    description: 'Election administrators only — manage elections, approve candidates, and review audit logs.',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 48 }} />,
    accent: 'primary.main',
    tooltip: 'Sign in as an election administrator',
  },
];

export default function LoginPortal() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box
        className="vu-hero-animated"
        sx={{
          textAlign: 'center',
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `3px solid ${VU_GOLD}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={72} onDark animated />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Sign In
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
          {PROJECT.university} · {PROJECT.unit}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 2 }}>
          Choose how you want to access the Online Voting System.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {portals.map((portal) => (
          <Grid item xs={12} sm={6} key={portal.to}>
            <ClickableTooltip title={portal.tooltip} to={portal.to} fullWidth clickable={false}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  borderTop: 4,
                  borderColor: portal.accent,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,51,102,0.18)',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    '&:hover': { transform: 'none' },
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={portal.to}
                  sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  aria-label={portal.tooltip}
                >
                  <Box color={portal.accent} sx={{ mb: 2 }}>{portal.icon}</Box>
                  <Typography variant="h6" component="h2" gutterBottom fontWeight={600}>
                    {portal.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {portal.description}
                  </Typography>
                </CardActionArea>
              </Card>
            </ClickableTooltip>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
        New student?{' '}
        <ClickableTooltip title="Create a VU voter account" to="/register" clickable={false}>
          <Typography component={Link} to="/register" variant="body2" color="primary" sx={{ textDecoration: 'underline' }}>
            Register to vote
          </Typography>
        </ClickableTooltip>
      </Typography>
    </Box>
  );
}
