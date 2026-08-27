import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Button, TextField, Chip, Box, Alert, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import api from '../services/api';
import TeamMemberCard from '../components/TeamMemberCard';
import { PROJECT, TEAM } from '../constants/team';

export default function Dashboard() {
  const [elections, setElections] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async (q) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/elections/search', { params: q ? { q } : {} });
      setElections(res.data.elections.filter((e) => e.status !== 'draft'));
    } catch (err) {
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = { published: 'info', active: 'success', closed: 'warning', certified: 'primary' };
  const canVote = (e) => {
    const now = Date.now();
    return ['published', 'active'].includes(e.status)
      && new Date(e.startTime).getTime() <= now
      && new Date(e.endTime).getTime() > now;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom component="h1">My Elections</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button component={Link} to="/my-ballots" variant="contained" startIcon={<HowToVoteIcon />}>
          Go to My Ballots
        </Button>
        <Button component={Link} to="/live" variant="outlined" startIcon={<LiveTvIcon />}>
          View Live Results
        </Button>
        <Button component={Link} to="/help" variant="outlined" startIcon={<HelpOutlineIcon />}>
          Help & FAQ
        </Button>
        <Button component={Link} to="/profile" variant="outlined" startIcon={<PersonOutlineIcon />}>
          My Profile
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search elections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadElections(search)}
          aria-label="Search elections"
        />
        <Button variant="contained" startIcon={<SearchIcon />} onClick={() => loadElections(search)}>Search</Button>
        <Button component={Link} to="/apply" variant="outlined">Apply as Candidate</Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading elections" />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {elections.map((e) => (
            <Grid item xs={12} sm={6} md={4} key={e._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{e.title}</Typography>
                  <Chip label={e.status} color={statusColor[e.status] || 'default'} size="small" sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(e.startTime).toLocaleString()} — {new Date(e.endTime).toLocaleString()}
                  </Typography>
                  {canVote(e) && (
                    <Button component={Link} to={`/vote/${e._id}`} variant="contained" sx={{ mt: 2 }} fullWidth aria-label={`Vote in ${e.title}`}>
                      Vote Now
                    </Button>
                  )}
                  <Button component={Link} to={`/live/${e._id}`} size="small" sx={{ mt: 1 }} fullWidth>
                    View Live Results
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {elections.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">No elections available at this time. Check back when an election is published.</Alert>
            </Grid>
          )}
        </Grid>
      )}

      <Card sx={{ mt: 4, borderTop: 3, borderColor: 'secondary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <GroupsIcon color="primary" />
            <Typography variant="h6" component="h2" color="primary" fontWeight={700}>
              {PROJECT.group} Development Team
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Built for {PROJECT.unit} · {PROJECT.university}
          </Typography>
          <Grid container spacing={2}>
            {TEAM.map((member) => (
              <Grid item xs={12} sm={6} md={3} key={member.slug}>
                <TeamMemberCard member={member} compact />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2, textAlign: { xs: 'center', sm: 'left' } }}>
            <Button component={Link} to="/team" variant="outlined" color="primary" size="small">
              View team profiles
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
