import {
  Box, Typography, Button, Grid, Card, CardContent, Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupsIcon from '@mui/icons-material/Groups';
import VuLogo from '../components/VuLogo';
import TeamMemberCard from '../components/TeamMemberCard';
import { PROJECT, TEAM } from '../constants/team';

export default function Home() {
  return (
    <Box>
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 6 },
          px: 3,
          mb: 5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #002244 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,51,102,0.25)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -80,
            right: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(212,175,55,0.08)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #C5A572, #D4AF37, #C5A572)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <VuLogo height={76} onDark />
        </Box>
        <Typography variant="h3" component="h1" gutterBottom fontWeight={700} sx={{ position: 'relative', zIndex: 1 }}>
          {PROJECT.title}
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.92, mb: 1, color: 'secondary.main', position: 'relative', zIndex: 1 }}>
          {PROJECT.university}
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 640, mx: 'auto', opacity: 0.88, mb: 3, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
          Secure, accessible, and transparent campus elections for Victoria University students.
          Register with your VU identity, cast verified digital ballots, and follow live results in real time.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
          <Chip label={PROJECT.projectNumber} sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 700 }} />
          <Chip label={PROJECT.unit} variant="outlined" sx={{ borderColor: 'secondary.main', color: 'secondary.main' }} />
          <Chip label={PROJECT.group} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }} />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <Button component={Link} to="/register" variant="contained" color="secondary" size="large">
            Register to Vote
          </Button>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            size="large"
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
          >
            Sign In
          </Button>
          <Button
            component={Link}
            to="/live"
            variant="outlined"
            size="large"
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            View Live Results
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { icon: <HowToVoteIcon fontSize="large" />, title: 'Digital Ballots', desc: 'Cast votes online from any device during active election windows' },
          { icon: <SecurityIcon fontSize="large" />, title: 'Identity Verified', desc: 'Selfie verification and OTP authentication for VU students' },
          { icon: <SpeedIcon fontSize="large" />, title: 'Live Results', desc: 'Real-time public vote counting dashboard with turnout metrics' },
        ].map((f) => (
          <Grid item xs={12} md={4} key={f.title}>
            <Card
              sx={{
                height: '100%',
                borderTop: 3,
                borderColor: 'secondary.main',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,51,102,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box color="primary.main" sx={{ mb: 1.5 }}>{f.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{f.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <GroupsIcon color="primary" />
        <Typography variant="h5" component="h2" color="primary" fontWeight={700}>
          NIT3003 Capstone Development Team
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        {PROJECT.fullName} · Semester 1 {PROJECT.year}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {TEAM.map((member) => (
          <Grid item xs={12} sm={6} md={3} key={member.slug}>
            <TeamMemberCard member={member} compact />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center' }}>
        <Button component={Link} to="/team" variant="contained" color="primary" sx={{ mr: 1, mb: 1 }}>
          Meet the full team
        </Button>
        <Button component={Link} to="/about" variant="outlined" color="primary" sx={{ mb: 1 }}>
          View project details
        </Button>
      </Box>
    </Box>
  );
}
