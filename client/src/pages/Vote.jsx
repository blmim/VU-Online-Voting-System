import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Stack, Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import api from '../services/api';
import SelfieCapture from '../components/SelfieCapture';
import CandidateBallotCard from '../components/CandidateBallotCard';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ManifestoCompare from '../components/ManifestoCompare';
import PageHero from '../components/PageHero';
import { VU_GOLD } from '../theme';

const STEPS = ['Select candidates', 'Verify identity', 'Confirm vote'];

export default function Vote() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ballot, setBallot] = useState(null);
  const [selections, setSelections] = useState({});
  const [selfie, setSelfie] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setBallot(null);
    setSelections({});
    setSelfie(null);
    setActiveStep(0);
    setError('');
    setReceipt('');
    setConfirmed(false);
    setConfirmOpen(false);

    api.get(`/elections/${id}/ballot`)
      .then((res) => {
        setBallot(res.data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Cannot load ballot');
      });
  }, [id]);

  const votablePositions = ballot?.votablePositions || ballot?.positions?.filter(
    (p) => !(ballot.candidatePositions || []).some((cp) => String(cp._id) === String(p._id))
  ) || [];

  const pendingPositions = votablePositions.filter(
    (p) => !ballot?.votedPositionIds?.map(String).includes(String(p._id))
  );

  const allSelected = pendingPositions.length > 0 && pendingPositions.every((p) => selections[p._id]);
  const requireSelfie = ballot?.election?.settings?.requireSelfieVerification !== false;

  const handleSelect = (positionId, candidateId) => {
    setSelections({ ...selections, [positionId]: candidateId });
  };

  const goToSelfie = () => {
    if (!allSelected) return;
    if (requireSelfie) {
      setActiveStep(1);
    } else {
      setConfirmOpen(true);
    }
  };

  const submitVote = async () => {
    setError('');
    if (requireSelfie && !selfie) {
      setError('Please capture a selfie before submitting your vote.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/votes', {
        electionId: id,
        selections: pendingPositions.map((p) => ({ positionId: p._id, candidateId: selections[p._id] })),
        voteSelfie: requireSelfie ? selfie : undefined,
      });
      setReceipt(res.data.receipt);
      setConfirmOpen(false);
      setConfirmed(true);
      setActiveStep(2);
      if (res.data.anomalyFlagged) {
        showToast('Vote recorded — identity verification flagged for admin review', 'warning');
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
        <CircularProgress />
        <Typography color="text.secondary">Loading your ballot…</Typography>
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

  if (user && user.isVerified === false) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Email verification is required before you can access the official ballot.
          Please verify your VU email, then return here to vote.
        </Alert>
        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/profile" variant="contained">Go to profile</Button>
          <Button component={Link} to="/my-ballots" variant="outlined">Back to My Ballots</Button>
        </Stack>
      </Box>
    );
  }

  if (confirmed) {
    return (
      <Card sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', borderTop: `4px solid ${VU_GOLD}` }}>
        <CardContent sx={{ p: 4 }}>
          <HowToVoteIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
          <Typography variant="h4" color="success.main" gutterBottom fontWeight={700}>
            Vote confirmed
          </Typography>
          <Typography paragraph>Your ballot was recorded. Keep your receipt for your records.</Typography>
          <Chip label={`Receipt: ${receipt}`} sx={{ mb: 2, fontWeight: 600 }} />
          <Button component={Link} to="/verify-receipt" variant="text" size="small" sx={{ display: 'block', mb: 2 }}>
            Verify this receipt
          </Button>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/my-ballots')}>My Ballots</Button>
            <Button component={Link} to={`/live/${id}`} variant="outlined">View results</Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Button component={Link} to="/my-ballots" variant="outlined" sx={{ mb: 2 }}>← Back to My Ballots</Button>

      <PageHero title={ballot.election.title} subtitle="Official ballot — select one candidate per position" compact />

      <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {ballot.isCandidateInElection && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are registered as a <strong>candidate</strong> in this election. You may still vote in other positions,
          but you cannot vote in a race where you are on the ballot.
        </Alert>
      )}

      {(ballot.candidatePositions || []).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are a candidate for:{' '}
          <strong>{ballot.candidatePositions.map((p) => p.title).join(', ')}</strong>
          {' '}— those positions are hidden from your ballot.
        </Alert>
      )}

      {activeStep === 0 && (
        <>
          {pendingPositions.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              You have no remaining positions to vote on in this election.
              {(ballot.votedPositionIds?.length > 0 || (ballot.candidatePositions || []).length > 0)
                ? ' You may have already voted or are a candidate in every race.'
                : ' There are no eligible positions on your ballot.'}
              {' '}<Button component={Link} to="/my-ballots" size="small">Back to My Ballots</Button>
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            Select <strong>one candidate per position</strong>. Photos and manifestos help you compare contestants.
            You are voting as a <strong>registered voter</strong>, not as a candidate.
          </Alert>

          <ManifestoCompare candidates={ballot.candidates} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {ballot.positions.map((pos) => {
                const isCandidateRace = (ballot.candidatePositions || []).some((p) => String(p._id) === String(pos._id));
                const voted = ballot.votedPositionIds?.map(String).includes(String(pos._id));
                const posCandidates = ballot.candidates.filter((c) => String(c.positionId) === String(pos._id));

                return (
                  <Box key={pos._id} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                      {pos.title}
                    </Typography>
                    {isCandidateRace ? (
                      <Alert severity="warning">You are a candidate for this position — voting is not available here.</Alert>
                    ) : voted ? (
                      <Alert severity="success">You already voted for this position.</Alert>
                    ) : posCandidates.length === 0 ? (
                      <Alert severity="warning">No approved candidates yet.</Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {posCandidates.map((c) => (
                          <CandidateBallotCard
                            key={c._id}
                            candidate={c}
                            selected={selections[pos._id] === c._id}
                            onSelect={(cid) => handleSelect(pos._id, cid)}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 16, borderTop: `4px solid ${VU_GOLD}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Your selections</Typography>
                  {pendingPositions.map((p) => {
                    const sel = ballot.candidates.find((c) => c._id === selections[p._id]);
                    return (
                      <Typography key={p._id} variant="body2" sx={{ mb: 0.5 }}>
                        <strong>{p.title}:</strong> {sel?.displayName || '— not selected —'}
                      </Typography>
                    );
                  })}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={!allSelected || pendingPositions.length === 0}
                    onClick={goToSelfie}
                    startIcon={<HowToVoteIcon />}
                  >
                    {requireSelfie ? 'Continue to verification' : 'Review & submit'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {activeStep === 1 && requireSelfie && (
        <Box>
          <Typography variant="h5" gutterBottom fontWeight={700}>Identity verification</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Take a selfie to match your registration photo before your vote is counted.
          </Typography>
          <SelfieCapture label="Vote-time selfie" onCapture={setSelfie} />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button variant="contained" disabled={!selfie} onClick={() => setConfirmOpen(true)}>
              Review & submit
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm your vote</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>This cannot be undone. You are voting as a <strong>voter</strong> for:</Typography>
          {pendingPositions.map((p) => {
            const sel = ballot.candidates.find((c) => c._id === selections[p._id]);
            return (
              <Typography key={p._id} variant="body2" sx={{ mt: 1 }}>
                {p.title}: <strong>{sel?.displayName}</strong>
              </Typography>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConfirmOpen(false);
            if (requireSelfie) setActiveStep(1);
          }} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={submitVote} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit vote'}
          </Button>
        </DialogActions>
      </Dialog>

      {error && activeStep === 0 && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
