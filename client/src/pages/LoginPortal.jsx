import { Box, Typography, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VuLogo from '../components/VuLogo';
import { PROJECT } from '../constants/team';

const portals = [
  {
    to: '/login/student',
    title: 'Student Login',
    description: 'Sign in with your VU student email to vote, apply as a candidate, and view your dashboard.',
    icon: <HowToVoteIcon sx={{ fontSize: 48 }} />,
    accent: 'secondary.main',
  },
  {
    to: '/login/admin',
    title: 'Administrator Login',
    description: 'Election administrators only — manage elections, approve candidates, and review audit logs.',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 48 }} />,
    accent: 'primary.main',
  },
];

export default function LoginPortal() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={56} />
        </Box>
        <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {PROJECT.university} · {PROJECT.unit}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Choose how you want to access the Online Voting System.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {portals.map((portal) => (
          <Grid item xs={12} sm={6} key={portal.to}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderTop: 4,
                borderColor: portal.accent,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
              }}
            >
              <CardActionArea
                component={Link}
                to={portal.to}
                sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
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
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
        New student?{' '}
        <Typography component={Link} to="/register" variant="body2" color="primary" sx={{ textDecoration: 'underline' }}>
          Register to vote
        </Typography>
      </Typography>
    </Box>
  );
}
