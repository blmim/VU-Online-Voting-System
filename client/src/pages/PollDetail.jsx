import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Radio, Stack, Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';
import PageHero from '../components/PageHero';
import PollResultsCharts from '../components/PollResultsCharts';
import PollAnalysisPanel from '../components/PollAnalysisPanel';
import PollCommentSection from '../components/PollCommentSection';
import ChampionshipScoreboard from '../components/ChampionshipScoreboard';
import InteractiveVoteLineChart from '../components/InteractiveVoteLineChart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VU_GOLD } from '../theme';

export default function PollDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/polls/${id}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Poll not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const submitVote = async () => {
    if (!selectedOption) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/polls/${id}/vote`, { optionId: selectedOption });
      showToast(res.data.message || 'Prediction recorded', 'success');
      setConfirmOpen(false);
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record prediction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress aria-label="Loading poll" />
        <Typography color="text.secondary">Loading poll…</Typography>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Poll not found'}</Alert>
        <Button component={Link} to="/polls" startIcon={<ArrowBackIcon />}>Back to polls</Button>
      </Box>
    );
  }

  const { poll, analysis, hasVoted, userVoteOptionId, comments } = data;
  const isClosed = poll.status === 'closed' || (poll.closesAt && new Date(poll.closesAt) < new Date());
  const canVote = user && !hasVoted && !isClosed && poll.status === 'active';

  return (
    <Box>
      <Button component={Link} to="/polls" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        All polls
      </Button>

      <PageHero title={poll.title} subtitle={poll.description} compact>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<InfoOutlinedIcon />}
            label="Public opinion poll — NOT an official vote"
            sx={{ bgcolor: 'rgba(255,193,7,0.25)', color: 'white', fontWeight: 700 }}
          />
          {isClosed && <Chip label="Poll closed" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />}
          {poll.electionId?.title && (
            <Chip label={poll.electionId.title} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }} />
          )}
        </Stack>
      </PageHero>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {analysis?.results?.length >= 2 && (
            <Box sx={{ mb: 3 }}>
              <ChampionshipScoreboard
                title="Prediction Championship"
                subtitle="Public opinion poll — not an official vote"
                fighters={analysis.results.map((r) => ({
                  candidateId: r.optionId,
                  displayName: r.displayName,
                  photoUrl: r.photoUrl,
                  voteCount: r.voteCount,
                  votePct: r.votePct,
                }))}
                marginThreshold={3}
              />
            </Box>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Results</Typography>
              <PollResultsCharts results={analysis?.results} />
            </CardContent>
          </Card>

          <PollCommentSection pollId={id} comments={comments} onRefresh={load} />
        </Grid>

        <Grid item xs={12} lg={4}>
          <PollAnalysisPanel analysis={analysis} />

          <Card sx={{ mt: 3, borderTop: `4px solid ${VU_GOLD}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {hasVoted ? 'Your prediction' : 'Cast your prediction'}
              </Typography>

              {hasVoted && (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  You predicted:{' '}
                  <strong>
                    {poll.options.find((o) => String(o._id) === String(userVoteOptionId))?.displayName}
                  </strong>
                </Alert>
              )}

              {!user && !hasVoted && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Link to="/login/student">Sign in</Link> to record your prediction (one per poll).
                </Alert>
              )}

              {canVote && (
                <Stack spacing={1}>
                  {poll.options.map((opt) => (
                    <Card
                      key={opt._id}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderColor: selectedOption === opt._id ? VU_GOLD : 'divider',
                        borderWidth: selectedOption === opt._id ? 2 : 1,
                      }}
                      onClick={() => setSelectedOption(opt._id)}
                    >
                      <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Radio checked={selectedOption === opt._id} value={opt._id} />
                        <Avatar src={opt.photoUrl || undefined} alt="" sx={{ width: 40, height: 40 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={600}>{opt.displayName}</Typography>
                          {opt.manifesto && (
                            <Typography variant="caption" color="text.secondary">
                              {opt.manifesto.slice(0, 80)}…
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<HowToVoteIcon />}
                    disabled={!selectedOption}
                    onClick={() => setConfirmOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    Submit prediction
                  </Button>
                </Stack>
              )}

              {isClosed && !hasVoted && (
                <Alert severity="info">This poll has closed. Results are shown for reference only.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm your prediction</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This is a <strong>public opinion poll</strong> — not an official vote. You cannot change your prediction.
          </Alert>
          <Typography>
            Predict:{' '}
            <strong>{poll.options.find((o) => o._id === selectedOption)?.displayName}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={submitVote} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
