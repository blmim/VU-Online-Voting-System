import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, MenuItem, TextField } from '@mui/material';
import { io } from 'socket.io-client';
import api from '../services/api';
import ElectionResultsView from '../components/ElectionResultsView';

export default function LiveResults() {
  const { id: paramId } = useParams();
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState(paramId || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = async (eid) => {
    if (!eid) return;
    try {
      const res = await api.get(`/results/live/${eid}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setData(null);
      setError(err.response?.data?.error || 'Results unavailable');
    }
  };

  useEffect(() => {
    api.get('/elections/public').then((r) => {
      setElections(r.data.elections);
      if (!electionId && r.data.elections[0]) setElectionId(r.data.elections[0]._id);
    });
  }, []);

  useEffect(() => {
    if (paramId) setElectionId(paramId);
  }, [paramId]);

  useEffect(() => {
    if (electionId) load(electionId);
    const token = localStorage.getItem('token');
    const socket = io('/', {
      path: '/socket.io',
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
    socket.on('vote:update', () => load(electionId));
    socket.on('election:certified', () => load(electionId));
    if (electionId) {
      // Auth via handshake.auth / cookie only — join payload is election id (no body JWT)
      socket.emit('join:election', electionId);
    }
    const interval = setInterval(() => load(electionId), 30000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [electionId]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom component="h1">Public Live Results</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Real-time vote counts for campus elections. Switch chart types to explore results by position.
      </Typography>
      <TextField
        select
        label="Election"
        value={electionId}
        onChange={(e) => setElectionId(e.target.value)}
        sx={{ mb: 3, minWidth: 300 }}
      >
        {elections.length === 0 && (
          <MenuItem value="" disabled>No public elections available</MenuItem>
        )}
        {elections.map((e) => (
          <MenuItem key={e._id} value={e._id}>{e.title} ({e.status})</MenuItem>
        ))}
      </TextField>
      <ElectionResultsView data={data} error={error} />
    </Box>
  );
}
