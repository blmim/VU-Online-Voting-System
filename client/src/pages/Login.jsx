import { useState, useEffect } from 'react';

import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

import {
  Card, CardContent, TextField, Button, Typography, Alert, FormControlLabel, Checkbox,
  Box, Divider, CircularProgress, Link,
} from '@mui/material';

import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

import api from '../services/api';

import VuLogo from '../components/VuLogo';

import PasswordField from '../components/PasswordField';

import { PROJECT } from '../constants/team';



const PORTAL_CONFIG = {
  student: {
    title: 'Student Login',
    subtitle: 'Use your VU student email (s#######@live.vu.edu.au)',
    icon: <HowToVoteIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    successPath: (role) => (role === 'admin' ? '/admin' : '/dashboard'),
    validateRole: () => true,
    roleError: null,
  },
  admin: {
    title: 'Administrator Login',
    subtitle: 'Election administrator credentials only',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    successPath: () => '/admin',
    validateRole: (role) => role === 'admin',
    roleError: 'Access denied. This portal is for election administrators only.',
  },
};

export default function Login({ portal = 'student' }) {
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.student;

  const { login } = useAuth();

  const { showToast } = useToast();

  const navigate = useNavigate();

  const location = useLocation();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);

  const [otpStep, setOtpStep] = useState(false);

  const [userId, setUserId] = useState('');

  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const [devOtp, setDevOtp] = useState('');

  const [devHint, setDevHint] = useState('');



  useEffect(() => {

    if (location.state?.message) {

      showToast(location.state.message, 'success');

      window.history.replaceState({}, document.title);

    }

  }, [location.state, showToast]);



  const handleLogin = async (e) => {

    e.preventDefault();

    setError('');

    setLoading(true);

    try {

      const res = await api.post('/auth/login', { email, password, rememberMe });

      if (res.data.requireOtp) {

        setUserId(res.data.userId);

        setOtpStep(true);

        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
          setDevHint(res.data.devHint || '');
          setOtp(res.data.devOtp);
          showToast(`Demo OTP: ${res.data.devOtp} (email not in Gmail — see note on screen)`, 'warning');
        } else {
          setDevOtp('');
          setDevHint('');
          showToast('OTP sent to your VU email', 'info');
        }

      } else {
        setError('Login requires email OTP verification. Please try again.');
      }

    } catch (err) {

      if (err.response?.status === 429) {

        setError(err.response?.data?.error || 'Too many authentication attempts — please wait and try again');

      } else {

        setError(err.response?.data?.error || 'Login failed');

      }

    } finally {

      setLoading(false);

    }

  };

  const handleOtp = async () => {

    setLoading(true);

    setError('');

    try {

      const res = await api.post('/auth/verify-login-otp', { userId, otp, rememberMe });

      if (!config.validateRole(res.data.user.role)) {
        setError(config.roleError);
      } else {
        login(res.data.token, res.data.user);
        showToast('Login successful', 'success');
        navigate(config.successPath(res.data.user.role));
      }

    } catch (err) {

      if (err.response?.status === 429) {

        setError('Account locked — try again in 15 minutes');

      } else {

        setError(err.response?.data?.error || 'OTP verification failed');

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

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{config.icon}</Box>

        <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
          {config.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {PROJECT.university} · {PROJECT.unit}
        </Typography>

      </Box>



      <Card elevation={3}>

        <CardContent sx={{ p: 4 }}>

          <Typography variant="h6" gutterBottom component="h2">

            Sign in to your account

          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {config.subtitle}
          </Typography>

          <Divider sx={{ mb: 3 }} />



          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!otpStep ? (

            <Box component="form" onSubmit={handleLogin}>

              <TextField fullWidth label="VU Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />

              <PasswordField
                fullWidth
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="off"
                inputProps={{ autoComplete: 'off' }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>

                <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />} label="Remember me" />

                <Link component={RouterLink} to="/forgot-password" variant="body2">Forgot password?</Link>

              </Box>

              <Alert severity="info" sx={{ mt: 1.5 }}>
                After password check, a one-time code is always sent to your VU email.
              </Alert>

              <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={loading}>

                {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue to OTP'}

              </Button>

            </Box>

          ) : (

            <Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>

                Enter the one-time password. Codes are sent to your VU email ({`<s#######@live.vu.edu.au>`}), not your personal Gmail.

              </Typography>

              {devOtp && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Local demo code: {devOtp}</strong>
                  {devHint ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{devHint}</Typography>
                  ) : null}
                </Alert>
              )}

              <TextField fullWidth label="OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" />

              <Button variant="contained" fullWidth size="large" onClick={handleOtp} sx={{ mt: 2 }} disabled={loading}>

                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}

              </Button>

              <Button
                fullWidth
                sx={{ mt: 1 }}
                onClick={async () => {
                  setError('');
                  try {
                    const res = await api.post('/auth/resend-otp', { userId, purpose: 'login' });
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
              </Button>

              <Button fullWidth sx={{ mt: 1 }} onClick={() => { setOtpStep(false); setDevOtp(''); setDevHint(''); }}>Back</Button>

            </Box>

          )}

        </CardContent>

      </Card>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/login" underline="hover">
          Back to login options
        </Link>
        {portal === 'student' && (
          <>
            {' · '}
            <Link component={RouterLink} to="/login/admin" underline="hover">
              Administrator login
            </Link>
          </>
        )}
        {portal === 'admin' && (
          <>
            {' · '}
            <Link component={RouterLink} to="/login/student" underline="hover">
              Student login
            </Link>
          </>
        )}
      </Typography>

    </Box>

  );

}
