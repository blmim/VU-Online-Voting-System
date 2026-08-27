import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Radio, RadioGroup, FormControlLabel,
  Button, Alert, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
} from '@mui/material';
import api from '../services/api';
import SelfieCapture from '../components/SelfieCapture';
import { useToast } from '../context/ToastContext';

export default function Vote() {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ballot, setBallot] = useState(null);
  const [selections, setSelections] = useState({});
  const [selfie, setSelfie] = useState(null);
  const [step, setStep] = useState('ballot');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/elections/${id}/ballot`).then((res) => setBallot(res.data)).catch((err) => {
      setError(err.response?.data?.error || 'Cannot load ballot');
    });
  }, [id]);

  const handleSelect = (positionId, candidateId) => {
    setSelections({ ...selections, [positionId]: candidateId });
  };

  const pendingPositions = ballot?.positions?.filter((p) => !ballot.votedPositionIds?.includes(p._id)) || [];
  const allSelected = pendingPositions.every((p) => selections[p._id]);
  const requireSelfie = ballot?.election?.settings?.requireSelfieVerification !== false;
  const sendConfirmationEmail = ballot?.election?.settings?.sendVoteConfirmationEmail !== false;

  const handleContinue = () => {
    if (requireSelfie) {
      setStep('selfie');
    } else {
      setConfirmOpen(true);
    }
  };

  const submitVote = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/votes', {
        electionId: id,
        selections: pendingPositions.map((p) => ({ positionId: p._id, candidateId: selections[p._id] })),
        voteSelfie: selfie,
      });
      setReceipt(res.data.receipt);
      setConfirmOpen(false);
      setStep('confirmed');
      if (sendConfirmationEmail) {
        showToast(
          res.data.confirmationEmailSent
            ? 'Vote recorded — confirmation email sent to your VU inbox'
            : 'Vote recorded — confirmation email queued (check server console in dev mode)',
          'success'
        );
      } else {
        showToast('Vote recorded successfully', 'success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Vote submission failed');
      showToast(err.response?.data?.error || 'Vote submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ballot && !error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
        <CircularProgress aria-label="Loading ballot" />
        <Typography color="text.secondary">Loading ballot…</Typography>
        <Button component={Link} to="/my-ballots" variant="outlined">Back to My Ballots</Button>
      </Box>
    );
  }
  if (error && !ballot) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button component={Link} to="/my-ballots" variant="contained">Back to My Ballots</Button>
      </Box>
    );
  }

  if (step === 'confirmed') {
    return (
      <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h4" color="success.main" gutterBottom>✓ Vote Confirmed</Typography>
          <Typography paragraph>Your vote has been recorded successfully.</Typography>
          <Typography>Receipt: <strong>{receipt}</strong></Typography>
          {sendConfirmationEmail && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              A vote confirmation email with your receipt has been sent to your VU email address.
            </Typography>
          )}
          <Button variant="contained" onClick={() => navigate('/my-ballots')} sx={{ mt: 2 }}>Return to My Ballots</Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'selfie') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Identity Verification</Typography>
        <Typography gutterBottom>Take a selfie before submitting your vote. This is compared to your registration photo.</Typography>
        <SelfieCapture label="Vote-time Selfie" onCapture={setSelfie} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button onClick={() => setStep('ballot')}>Back</Button>
          <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={!selfie}>Review and Submit</Button>
        </Box>
        <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)}>
          <DialogTitle>Confirm your vote</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>You are about to submit your ballot. This action cannot be undone.</Typography>
            {pendingPositions.map((p) => {
              const sel = ballot.candidates.find((c) => c._id === selections[p._id]);
              return <Typography key={p._id} variant="body2">{p.title}: <strong>{sel?.displayName}</strong></Typography>;
            })}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="contained" onClick={submitVote} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Confirm Vote'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button component={Link} to="/my-ballots" variant="outlined">Back to My Ballots</Button>
      </Box>
      <Typography variant="h4" gutterBottom>{ballot.election.title}</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {requireSelfie
          ? 'Select one candidate per position. You will verify your identity with a selfie before submitting.'
          : 'Select one candidate per position, then review and submit your ballot.'}
      </Alert>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {ballot.positions.map((pos) => {
            const posCandidates = ballot.candidates.filter((c) => String(c.positionId) === String(pos._id));
            const voted = ballot.votedPositionIds?.map(String).includes(String(pos._id));
            return (
              <Card key={pos._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{pos.title}</Typography>
                  {voted ? (
                    <Alert severity="success">Already voted for this position</Alert>
                  ) : posCandidates.length === 0 ? (
                    <Alert severity="warning">No approved candidates for this position yet.</Alert>
                  ) : (
                    <RadioGroup value={selections[pos._id] || ''} onChange={(e) => handleSelect(pos._id, e.target.value)}>
                      {posCandidates.map((c) => (
                        <FormControlLabel key={c._id} value={c._id} control={<Radio />} label={`${c.displayName} — ${c.manifesto?.slice(0, 80)}`} />
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Typography variant="h6">Review My Votes</Typography>
              <Divider sx={{ my: 1 }} />
              {ballot.positions.map((p) => {
                const sel = ballot.candidates.find((c) => c._id === selections[p._id]);
                return <Typography key={p._id} variant="body2">{p.title}: {sel?.displayName || '(none)'}</Typography>;
              })}
              <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={!allSelected || pendingPositions.length === 0} onClick={handleContinue}>
                {requireSelfie ? 'Continue to Selfie Verification' : 'Review and Submit'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {!requireSelfie && (
        <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)}>
          <DialogTitle>Confirm your vote</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>You are about to submit your ballot. This action cannot be undone.</Typography>
            {pendingPositions.map((p) => {
              const sel = ballot.candidates.find((c) => c._id === selections[p._id]);
              return <Typography key={p._id} variant="body2">{p.title}: <strong>{sel?.displayName}</strong></Typography>;
            })}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="contained" onClick={submitVote} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Confirm Vote'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
