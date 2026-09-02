import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import PageHero from '../components/PageHero';
import { VU_GOLD } from '../theme';

export default function VerifyReceipt() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e?.preventDefault();
    const receipt = code.trim().toUpperCase();
    if (!receipt) {
      setError('Please enter a receipt code');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/votes/verify/${encodeURIComponent(receipt)}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Receipt not found');
      setResult(err.response?.data?.valid === false ? err.response.data : null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHero
        title="Verify vote receipt"
        subtitle="Enter the receipt code from your vote confirmation to verify it was recorded. Candidate choices remain secret."
      />

      <Card sx={{ maxWidth: 520, mx: 'auto', borderTop: `4px solid ${VU_GOLD}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleVerify}>
            <TextField
              label="Receipt code"
              placeholder="e.g. VU-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ 'aria-label': 'Receipt code' }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Verify receipt'}
            </Button>
          </Box>

          {error && !result?.valid && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}

          {result?.valid && (
            <Alert severity="success" icon={<VerifiedIcon />} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>Receipt verified</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Code: <strong>{result.receipt}</strong>
              </Typography>
              {result.election && (
                <Typography variant="body2">
                  Election: <strong>{result.election.title}</strong> ({result.election.status})
                </Typography>
              )}
              {result.castAt && (
                <Typography variant="body2">
                  Recorded: {new Date(result.castAt).toLocaleString('en-AU')}
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {result.message}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Stack spacing={1} sx={{ mt: 3, maxWidth: 520, mx: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          Receipts are issued after you submit an official ballot. They confirm participation without revealing who you voted for.
        </Typography>
      </Stack>
    </Box>
  );
}
