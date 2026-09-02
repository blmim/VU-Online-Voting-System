import { useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Card, CardContent,
  Divider, Link, List, ListItem, ListItemText, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { PROJECT } from '../constants/team';
import { VU_GOLD } from '../theme';

const STEPS = [
  'Register with your VU student ID (S#######), @live.vu.edu.au email, and a reference selfie.',
  'Verify your email using the 6-digit OTP sent after registration.',
  'Sign in from the Login page. Optional OTP login adds an extra verification step.',
  'Open your Dashboard to see elections you are eligible for.',
  'Select Vote Now, review the ballot, capture a vote-time selfie, and confirm your choices.',
  'Keep your vote receipt — verify it anytime on the Verify Receipt page. Results appear on Live Results when published.',
  'Visit Public Polls to share predictions (not official votes) and join campus discussions.',
];

const FAQ = [
  { q: 'I forgot my password', a: 'Use Forgot Password on the login page. Enter your VU email and student ID to receive a reset code.' },
  { q: 'My account is locked', a: 'After too many failed OTP attempts, your account locks for 15 minutes. Wait and try again.' },
  { q: 'Camera not working for selfie', a: 'Allow browser camera permissions and use HTTPS or localhost. Try another browser if needed.' },
  { q: 'Can I vote twice?', a: 'No. The system prevents duplicate votes per election using database constraints and audit logs.' },
  { q: 'Can candidates vote?', a: 'Yes, but not in positions where they are on the ballot. The system hides those races from your ballot automatically.' },
  { q: 'What are Public Polls?', a: 'Prediction polls let anyone share who they think will win. They are clearly labelled and separate from official voting.' },
  { q: 'How do I verify my vote receipt?', a: 'After voting, you receive a receipt code (e.g. VR-2026-XXXXXXXX). Enter it on the Verify Receipt page to confirm your ballot was recorded.' },
  { q: 'Are poll results official?', a: 'No. Public polls are for opinion and discussion only. Only votes cast through the official ballot count toward election results.' },
];

export default function Help() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHero
        title="Help & FAQ"
        subtitle={`How to participate in ${PROJECT.university} campus elections`}
        compact
      />

      <Card sx={{ mb: 3, borderTop: `4px solid ${VU_GOLD}` }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" gutterBottom fontWeight={700}>How to vote</Typography>
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

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" gutterBottom fontWeight={700}>Frequently asked questions</Typography>
          <Divider sx={{ mb: 1 }} />
          {FAQ.map(({ q, a }, i) => (
            <Accordion
              key={q}
              expanded={expanded === i}
              onChange={() => setExpanded(expanded === i ? false : i)}
              disableGutters
              elevation={0}
              sx={{ '&:before': { display: 'none' }, borderBottom: 1, borderColor: 'divider' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`faq-${i}`} id={`faq-header-${i}`}>
                <Typography fontWeight={600} color="primary.main">{q}</Typography>
              </AccordionSummary>
              <AccordionDetails id={`faq-${i}`}>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      <Alert severity="info">
        Need further assistance? Contact the Victoria University Elections Office at{' '}
        <Link href="mailto:elections@vu.edu.au">elections@vu.edu.au</Link>
        {' '}or visit{' '}
        <Link component={RouterLink} to="/verify-receipt">Verify Receipt</Link>
        {' · '}
        <Link component={RouterLink} to="/about">About & Credits</Link>.
      </Alert>
    </Box>
  );
}
