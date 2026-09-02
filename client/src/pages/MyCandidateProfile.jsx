import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Grid,
  LinearProgress, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../services/api';
import PageHero from '../components/PageHero';
import { useToast } from '../context/ToastContext';
import { VU_GOLD } from '../theme';

const FIELDS = [
  { key: 'tagline', label: 'Tagline', rows: 1, max: 160 },
  { key: 'bio', label: 'Bio', rows: 4, max: 3000 },
  { key: 'whyRunning', label: 'Why I\'m running', rows: 3, max: 2000 },
  { key: 'inspiration', label: 'Inspiration', rows: 2, max: 1000 },
  { key: 'goals', label: 'Goals', rows: 3, max: 2000 },
  { key: 'experience', label: 'Experience (one item per line)', rows: 4, max: 2000 },
  { key: 'speech', label: 'Campaign speech / pitch', rows: 5, max: 4000 },
  { key: 'manifesto', label: 'Manifesto summary', rows: 3, max: 2000 },
];

export default function MyCandidateProfile() {
  const { showToast } = useToast();
  const [form, setForm] = useState({});
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/candidates/me/profile')
      .then((r) => {
        setForm(r.data.profile);
        setProfileComplete(r.data.profile.profileComplete);
      })
      .catch((err) => setError(err.response?.data?.error || 'Not an approved candidate'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/candidates/me/profile', form);
      setProfileComplete(res.data.profile.profileComplete);
      showToast('Profile saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading profile" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning">{error}. Apply as a candidate and wait for admin approval.</Alert>;
  }

  const completionPct = profileComplete ? 100 : Math.round(
    (['tagline', 'bio', 'whyRunning', 'speech'].filter((k) => form[k]?.trim()).length / 4) * 100
  );

  return (
    <Box>
      <PageHero
        title="My Candidate Profile"
        subtitle="Build your campaign page — voters will see this on the ballot and candidate directory."
      />

      <Card sx={{ mb: 3, borderTop: `4px solid ${VU_GOLD}` }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Profile completeness</Typography>
          <LinearProgress variant="determinate" value={completionPct} sx={{ height: 10, borderRadius: 5, mb: 1, '& .MuiLinearProgress-bar': { bgcolor: VU_GOLD } }} />
          <Typography variant="caption" color="text.secondary">{completionPct}% — fill tagline, bio, why running, and speech to complete</Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {FIELDS.map((f) => (
          <Grid item xs={12} key={f.key}>
            <TextField
              label={f.label}
              value={form[f.key] || ''}
              onChange={handleChange(f.key)}
              fullWidth
              multiline={f.rows > 1}
              minRows={f.rows}
              inputProps={{ maxLength: f.max }}
              helperText={`${(form[f.key] || '').length}/${f.max}`}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          Save profile
        </Button>
        {form.candidateId && (
          <Button variant="outlined" href={`/candidates/${form.candidateId}`} target="_blank">
            Preview public profile
          </Button>
        )}
      </Box>
    </Box>
  );
}
