import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Stepper, Step, StepLabel,
  Typography, Alert, MenuItem, Grid, Divider, CircularProgress,
} from '@mui/material';
import api from '../services/api';
import SelfieCapture from '../components/SelfieCapture';
import PasswordField from '../components/PasswordField';
import VuLogo from '../components/VuLogo';
import { useToast } from '../context/ToastContext';
import { PROJECT } from '../constants/team';
const steps = ['Identity', 'Profile & Security', 'Selfie & Verify'];

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [devHint, setDevHint] = useState('');
  const [form, setForm] = useState({
    fullName: '', studentId: '', email: '', password: '', faculty: 'IT',
    department: 'Computer Science', year: 2, selfie: null,
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validStudentId = /^S\d{7}$/i.test(form.studentId);
  const validEmail = /^s\d{7}@live\.vu\.edu\.au$/i.test(form.email);

  const handleRegister = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', form);
      setUserId(res.data.userId);
      setStep(2);
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
        setDevHint(res.data.devHint || '');
        setOtp(res.data.devOtp);
        showToast(`Demo OTP: ${res.data.devOtp}`, 'warning');
      } else {
        showToast('OTP sent to your VU email', 'info');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp });
      localStorage.setItem('token', res.data.token);
      showToast('Registration complete — welcome!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <VuLogo height={56} />
        </Box>
        <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
          Student Registration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {PROJECT.university} · Campus Elections
        </Typography>
      </Box>

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={step} sx={{ mb: 3 }} aria-label="Registration progress">
            {steps.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
          <Divider sx={{ mb: 3 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {step === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Full Name" value={form.fullName} onChange={update('fullName')} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Student ID" placeholder="S8114083" value={form.studentId}
                  onChange={update('studentId')} error={form.studentId && !validStudentId}
                  helperText={validStudentId ? 'Valid format' : 'Format: S#######'} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="VU Email" value={form.email} onChange={update('email')}
                  error={form.email && !validEmail} helperText="s#######@live.vu.edu.au" required />
              </Grid>
              <Button variant="contained" onClick={() => setStep(1)} disabled={!form.fullName || !validStudentId || !validEmail}>
                Next
              </Button>
            </Grid>
          )}

          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <PasswordField fullWidth label="Password" value={form.password} onChange={update('password')} required helperText="Minimum 8 characters" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Faculty" value={form.faculty} onChange={update('faculty')}>
                  {['IT', 'Business', 'Engineering', 'Health'].map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Year" value={form.year} onChange={update('year')}>
                  {[1, 2, 3, 4, 5].map((y) => <MenuItem key={y} value={y}>Year {y}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <SelfieCapture label="Reference Selfie (required)" onCapture={(s) => setForm({ ...form, selfie: s })} />
              </Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setStep(0)}>Back</Button>
                <Button variant="contained" onClick={handleRegister} disabled={!form.password || !form.selfie || submitting}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
                </Button>              </Box>
            </Grid>
          )}

          {step === 2 && (
            <Box>
              <Typography gutterBottom>
                Enter the 6-digit OTP. Emails go to your VU address (@live.vu.edu.au), not personal Gmail.
              </Typography>
              {devOtp && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Local demo code: {devOtp}</strong>
                  {devHint ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{devHint}</Typography>
                  ) : null}
                </Alert>
              )}
              <TextField fullWidth label="OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} inputProps={{ maxLength: 6 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={handleVerify} disabled={otp.length !== 6 || submitting}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : 'Verify & Complete Registration'}
                </Button>
                <Button
                  variant="outlined"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    try {
                      const res = await api.post('/auth/resend-otp', { userId, purpose: 'register' });
                      if (res.data.devOtp) {
                        setDevOtp(res.data.devOtp);
                        setDevHint(res.data.devHint || '');
                        setOtp(res.data.devOtp);
                        showToast(`New demo OTP: ${res.data.devOtp}`, 'warning');
                      } else {
                        showToast('A new OTP has been sent', 'info');
                      }
                    } catch (err) {
                      setError(err.response?.data?.error || 'Failed to resend OTP');
                    }
                  }}
                >
                  Resend OTP
                </Button>              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
