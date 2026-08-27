import { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Divider, CircularProgress, Grid } from '@mui/material';
import api from '../services/api';
import PasswordField from '../components/PasswordField';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setProfile(res.data.user))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      showToast(res.data.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Password change failed');
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

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Account Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={profile?.fullName || ''} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Student ID" value={profile?.studentId || ''} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="VU Email" value={profile?.email || ''} InputProps={{ readOnly: true }} helperText="Contact the elections office to update institutional email" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Faculty" value={profile?.faculty || ''} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Year" value={profile?.year || ''} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Change Password</Typography>
          <Divider sx={{ mb: 2 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleChangePassword}>
            <PasswordField fullWidth label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} margin="normal" required />
            <PasswordField fullWidth label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" required helperText="Minimum 8 characters" />
            <PasswordField fullWidth label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" required />
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving}>
              {saving ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
