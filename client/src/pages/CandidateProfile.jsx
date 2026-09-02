import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, Stack, Typography,
} from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import PageHero from '../components/PageHero';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function CandidateProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/candidates/${id}/profile`)
      .then((r) => setProfile(r.data.profile))
      .catch((err) => setError(err.response?.data?.error || 'Profile not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading profile" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button component={Link} to="/elections" startIcon={<ArrowBackIcon />}>Back</Button>
      </Box>
    );
  }

  const experienceLines = (profile.experience || '').split('\n').filter(Boolean);

  return (
    <Box>
      <Button component={Link} to={profile.electionId ? `/elections/${profile.electionId}?tab=candidates` : '/elections'} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to candidates
      </Button>

      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `4px solid ${VU_GOLD}`,
        }}
      >
        <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
          <Avatar
            src={profile.photoUrl || undefined}
            alt=""
            sx={{ width: 120, height: 120, border: `4px solid ${VU_GOLD}`, bgcolor: VU_NAVY }}
          />
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h3" fontWeight={800}>{profile.displayName}</Typography>
            {profile.tagline && (
              <Typography variant="h6" sx={{ opacity: 0.9, mt: 1, fontStyle: 'italic' }}>
                {profile.tagline}
              </Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              {profile.positionTitle && <Chip label={profile.positionTitle} sx={{ bgcolor: VU_GOLD, color: VU_NAVY, fontWeight: 700 }} />}
              {profile.studentId && <Chip label={profile.studentId} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }} />}
              {profile.profileComplete && <Chip label="Complete profile" color="success" size="small" />}
            </Stack>
          </Box>
        </Box>
      </Box>

      {profile.speech && (
        <Card sx={{ mb: 3, bgcolor: 'rgba(0,51,102,0.04)', borderLeft: `6px solid ${VU_GOLD}` }}>
          <CardContent sx={{ display: 'flex', gap: 2 }}>
            <FormatQuoteIcon sx={{ color: VU_GOLD, fontSize: 40, flexShrink: 0 }} />
            <Typography variant="h6" fontStyle="italic" lineHeight={1.7}>
              {profile.speech}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {profile.bio && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>About</Typography>
                <Typography lineHeight={1.8}>{profile.bio}</Typography>
              </CardContent>
            </Card>
          )}
          {profile.whyRunning && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>Why I&apos;m running</Typography>
                <Typography lineHeight={1.8}>{profile.whyRunning}</Typography>
              </CardContent>
            </Card>
          )}
          {profile.goals && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>Goals</Typography>
                <Typography lineHeight={1.8}>{profile.goals}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {experienceLines.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>Experience</Typography>
                {experienceLines.map((line) => (
                  <Box key={line} sx={{ display: 'flex', gap: 1.5, py: 1, borderLeft: `3px solid ${VU_GOLD}`, pl: 2, mb: 1 }}>
                    <Typography variant="body2">{line}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
          {profile.inspiration && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>Inspiration</Typography>
                <Typography variant="body2" lineHeight={1.7}>{profile.inspiration}</Typography>
              </CardContent>
            </Card>
          )}
          {profile.manifesto && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>Manifesto</Typography>
                <Typography variant="body2" lineHeight={1.7}>{profile.manifesto}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
