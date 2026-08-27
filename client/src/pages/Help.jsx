import { Box, Card, CardContent, Typography, Divider, List, ListItem, ListItemText, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VuLogo from '../components/VuLogo';
import { PROJECT } from '../constants/team';

const STEPS = [
  'Register with your VU student ID (S#######), @live.vu.edu.au email, and a reference selfie.',
  'Verify your email using the 6-digit OTP sent after registration.',
  'Sign in from the Login page. Optional OTP login adds an extra verification step.',
  'Open your Dashboard to see elections you are eligible for.',
  'Select Vote Now, review the ballot, capture a vote-time selfie, and confirm your choices.',
  'Keep your vote receipt email for your records. Results appear on Live Results when published.',
];

const FAQ = [
  { q: 'I forgot my password', a: 'Use Forgot Password on the login page. Enter your VU email and student ID to receive a reset code.' },
  { q: 'My account is locked', a: 'After too many failed OTP attempts, your account locks for 15 minutes. Wait and try again.' },
  { q: 'Camera not working for selfie', a: 'Allow browser camera permissions and use HTTPS or localhost. Try another browser if needed.' },
  { q: 'Can I vote twice?', a: 'No. The system prevents duplicate votes per election using database constraints and audit logs.' },
];

export default function Help() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={56} />
        </Box>
        <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
          Help & FAQ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          How to participate in {PROJECT.university} campus elections
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>How to Vote</Typography>
          <Divider sx={{ mb: 2 }} />
          <List dense>
            {STEPS.map((step, i) => (
              <ListItem key={step} sx={{ alignItems: 'flex-start' }}>
                <ListItemText primary={`${i + 1}. ${step}`} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
          <Divider sx={{ mb: 2 }} />
          {FAQ.map(({ q, a }) => (
            <Box key={q} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary">{q}</Typography>
              <Typography variant="body2" color="text.secondary">{a}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Alert severity="info">
        Need further assistance? Contact the Victoria University Elections Office at{' '}
        <Link href="mailto:elections@vu.edu.au">elections@vu.edu.au</Link>
        {' '}or visit{' '}
        <Link component={RouterLink} to="/about">About & Credits</Link>.
      </Alert>
    </Box>
  );
}
