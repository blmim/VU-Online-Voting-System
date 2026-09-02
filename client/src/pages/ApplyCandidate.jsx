import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, MenuItem, Card, CardContent, Alert, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ApplyCandidate() {
  const { showToast } = useToast();
  const [elections, setElections] = useState([]);
  const [positions, setPositions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ electionId: '', positionId: '', manifesto: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadPageData() {
      try {
        const [electionRes, applicationRes] = await Promise.all([
          api.get('/elections'),
          api.get('/applications/my'),
        ]);
        setElections(electionRes.data.elections.filter((e) => e.allowCandidateApplications));
        setApplications(applicationRes.data.applications);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load candidate application details');
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  useEffect(() => {
    if (form.electionId) {
      api
        .get(`/elections/${form.electionId}`)
        .then((r) => setPositions(r.data.positions.filter((p) => p.isEligible !== false)))
        .catch((err) => {
          setPositions([]);
          setError(err.response?.data?.error || 'Could not load positions for this election');
        });
    } else {
      setPositions([]);
    }
  }, [form.electionId]);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/applications', form);
      const message = 'Application submitted! You will receive an email when reviewed.';
      setMsg(message);
      showToast(message, 'success');
      const r = await api.get('/applications/my');
      setApplications(r.data.applications);
    } catch (err) {
      setError(err.response?.data?.error || 'Application failed');
      showToast(err.response?.data?.error || 'Application failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button component={Link} to="/dashboard" variant="outlined">Back to Dashboard</Button>
      </Box>
      <Typography variant="h4" gutterBottom>Apply as Candidate</Typography>
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading candidate application options...</Alert>}
      {!loading && elections.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>No elections are currently open for candidate applications.</Alert>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField select fullWidth label="Election" value={form.electionId} onChange={(e) => setForm({ ...form, electionId: e.target.value, positionId: '' })} sx={{ mb: 2 }}>
            {elections.map((e) => <MenuItem key={e._id} value={e._id}>{e.title}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Position" value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value })} sx={{ mb: 2 }} disabled={!form.electionId}>
            {positions.map((p) => <MenuItem key={p._id} value={p._id}>{p.title}</MenuItem>)}
          </TextField>
          <TextField fullWidth multiline rows={4} label="Manifesto" value={form.manifesto} onChange={(e) => setForm({ ...form, manifesto: e.target.value })} sx={{ mb: 2 }} />
          <Button variant="contained" onClick={submit} disabled={!form.electionId || !form.positionId || submitting}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </Button>
        </CardContent>
      </Card>
      <Typography variant="h6">My Applications</Typography>
      <Table>
        <TableHead><TableRow><TableCell>Election</TableCell><TableCell>Position</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>
          {applications.map((a) => (
            <TableRow key={a._id}>
              <TableCell>{a.electionId?.title}</TableCell>
              <TableCell>{a.positionId?.title}</TableCell>
              <TableCell>{a.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
