import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Divider, CircularProgress, Link } from '@mui/material';
import api from '../services/api';
import VuLogo from '../components/VuLogo';
import PasswordField from '../components/PasswordField';
import { PROJECT } from '../constants/team';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [email, setEmail] = useState(location.state?.email || '');
  const [studentId, setStudentId] = useState(location.state?.studentId || '');
  const [otp, setOtp] = useState(location.state?.devOtp || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const devOtp = location.state?.devOtp || '';
  const devHint = location.state?.devHint || '';

  const canSubmit = Boolean(email && studentId && otp && password && confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        studentId,
        otp,
        password,
        confirmPassword,
      });
      showToast(res.data.message, 'success');
      navigate('/login', { state: { message: 'Password reset successful — please sign in with your new password.' } });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Reset failed';
      if (err.response?.status === 429) {
        setError('Account locked — try again in 15 minutes');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={56} />
        </Box>
        <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {PROJECT.university} · {PROJECT.unit}
        </Typography>
      </Box>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {location.state?.email && (
            <Alert severity="info" sx={{ mb: 2 }}>
              If an account matches, a reset code was sent to {location.state.email} (VU email, not personal Gmail).
            </Alert>
          )}
          {devOtp && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Local demo reset code: {devOtp}</strong>
              {devHint ? (
                <Typography variant="body2" sx={{ mt: 0.5 }}>{devHint}</Typography>
              ) : null}
            </Alert>
          )}
          <Divider sx={{ mb: 3 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            {!location.state?.email && (
              <TextField fullWidth label="VU Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
            )}
            {!location.state?.studentId && (
              <TextField fullWidth label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} margin="normal" required />
            )}
            <TextField fullWidth label="6-Digit Reset Code" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" required inputProps={{ maxLength: 6 }} />
            <PasswordField fullWidth label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required helperText="Minimum 8 characters" />
            <PasswordField fullWidth label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" required />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={!canSubmit || loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
              disabled={!email || !studentId || loading}
              onClick={async () => {
                setError('');
                try {
                  await api.post('/auth/resend-otp', {
                    email,
                    studentId,
                    purpose: 'password_reset',
                  });
                  showToast('If an account matches, a new reset code has been sent', 'info');
                } catch (err) {
                  setError(err.response?.data?.error || 'Failed to resend code');
                }
              }}
            >
              Resend Reset Code
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/forgot-password">Request a new code</Link>
            {' · '}
            <Link component={RouterLink} to="/login">Back to login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
