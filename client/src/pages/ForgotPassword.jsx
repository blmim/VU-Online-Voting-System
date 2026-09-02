import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Divider, CircularProgress, Link } from '@mui/material';
import api from '../services/api';
import VuLogo from '../components/VuLogo';
import { PROJECT } from '../constants/team';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email, studentId });
      if (res.data.devOtp) {
        showToast(`Demo reset code: ${res.data.devOtp}`, 'warning');
        navigate('/reset-password', { state: { email, studentId, devOtp: res.data.devOtp, devHint: res.data.devHint } });
      } else {
        showToast(res.data.message, 'success');
        navigate('/reset-password', { state: { email, studentId } });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Request failed';
      if (err.response?.status === 429) {
        setError('Too many attempts or account locked — try again in 15 minutes');
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
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {PROJECT.university} · {PROJECT.unit}
        </Typography>
      </Box>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your VU email and student ID. We will send a 6-digit reset code valid for 15 minutes.
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="VU Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required placeholder="s8114083@live.vu.edu.au" />
            <TextField fullWidth label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} margin="normal" required placeholder="S8114083" />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login">Back to login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
