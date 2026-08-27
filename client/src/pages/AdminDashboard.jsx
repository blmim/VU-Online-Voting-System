import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField, Table, TableBody,
  TableCell, TableHead, TableRow, Alert, Tabs, Tab, Chip, LinearProgress, CircularProgress,
  IconButton, Fade, FormControlLabel, Switch, Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ElectionResultsView from '../components/ElectionResultsView';

const TAB_QUERY_MAP = {
  elections: 0,
  results: 1,
  search: 2,
  admins: 3,
  applications: 4,
  candidates: 4,
  anomalies: 5,
  audit: 6,
  announcements: 7,
  testing: 8,
};

const TAB_SLUGS = ['elections', 'results', 'search', 'admins', 'applications', 'anomalies', 'audit', 'announcements', 'testing'];

function tabFromQuery(tabParam) {
  if (!tabParam) return 0;
  return TAB_QUERY_MAP[tabParam.toLowerCase()] ?? 0;
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => tabFromQuery(searchParams.get('tab')));
  const [stats, setStats] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], candidates: [], applications: [], elections: [] });
  const [anomalies, setAnomalies] = useState([]);
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    settings: {
      showLiveResultsPublic: true,
      requireSelfieVerification: true,
      sendVoteConfirmationEmail: true,
    },
  });
  const [positionForm, setPositionForm] = useState({ electionId: '', title: '', seats: 1, faculties: 'IT', years: '1,2,3' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allElections, setAllElections] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoaded, setAuditLogsLoaded] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', electionId: '' });
  const [lastAnnouncement, setLastAnnouncement] = useState(null);
  const [generatorEnabled, setGeneratorEnabled] = useState(false);
  const [lastGeneratedUsers, setLastGeneratedUsers] = useState([]);
  const [candidateElectionId, setCandidateElectionId] = useState('');
  const [generating, setGenerating] = useState('');
  const [resultsElectionId, setResultsElectionId] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [resultsError, setResultsError] = useState('');
  const [resultsLoading, setResultsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoaded, setAdminsLoaded] = useState(false);
  const [promoteQ, setPromoteQ] = useState('');
  const [promoteResults, setPromoteResults] = useState([]);
  const [promotingId, setPromotingId] = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [dash, anomalyRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/anomalies'),
      ]);
      setStats(dash.data);
      setAnomalies(anomalyRes.data.anomalies);
      const electionRes = await api.get('/elections');
      setAllElections(electionRes.data.elections);
      try {
        const lastRes = await api.get('/admin/announcements/last');
        setLastAnnouncement(lastRes.data.announcement);
      } catch {
        setLastAnnouncement(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')));
  }, [searchParams]);

  const goToTab = (value) => {
    setTab(value);
    const slug = TAB_SLUGS[value];
    if (value === 0) {
      setSearchParams({});
    } else {
      setSearchParams({ tab: slug });
    }
  };

  const handleTabChange = (_, value) => goToTab(value);

  useEffect(() => {
    api.get('/admin/generate/status')
      .then((r) => setGeneratorEnabled(r.data.enabled))
      .catch(() => setGeneratorEnabled(false));
  }, []);

  const loadResults = async (eid) => {
    if (!eid) return;
    setResultsLoading(true);
    try {
      const res = await api.get(`/results/live/${eid}`);
      setResultsData(res.data);
      setResultsError('');
    } catch (err) {
      setResultsData(null);
      setResultsError(err.response?.data?.error || 'Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 1 && allElections.length > 0 && !resultsElectionId) {
      const preferred = allElections.find((e) => e.status === 'active')
        || allElections.find((e) => ['published', 'active', 'closed', 'certified'].includes(e.status))
        || allElections[0];
      if (preferred) setResultsElectionId(preferred._id);
    }
  }, [tab, allElections, resultsElectionId]);

  useEffect(() => {
    if (tab === 1 && resultsElectionId) loadResults(resultsElectionId);
  }, [tab, resultsElectionId]);

  useEffect(() => {
    if (tab === 3) {
      setAdminsLoaded(false);
      api.get('/admin/users/admins')
        .then((r) => setAdmins(r.data.admins))
        .catch((err) => setError(err.response?.data?.error || 'Failed to load administrators'))
        .finally(() => setAdminsLoaded(true));
    }
    if (tab === 4) {
      api.get('/applications/search', { params: { status: 'pending' } })
        .then((r) => setSearchResults((s) => ({ ...s, applications: r.data.applications })))
        .catch((err) => setError(err.response?.data?.error || 'Failed to load applications'));
    }
    if (tab === 6) {
      setAuditLogsLoaded(false);
      api.get('/admin/audit-logs')
        .then((r) => setAuditLogs(r.data.logs))
        .catch(() => setAuditLogs([]))
        .finally(() => setAuditLogsLoaded(true));
    }
  }, [tab]);

  const createElection = async () => {
    try {
      await api.post('/elections', electionForm);
      setMsg('Election created with stored ballot options');
      setElectionForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        settings: {
          showLiveResultsPublic: true,
          requireSelfieVerification: true,
          sendVoteConfirmationEmail: true,
        },
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create election');
    }
  };

  const publishElection = async (id) => {
    try {
      const res = await api.post(`/elections/${id}/publish`);
      setMsg(`Election published — ${res.data.emailsSent || 0} notification emails sent`);
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish election');
    }
  };

  const activateElection = async (id) => {
    try {
      await api.post(`/elections/${id}/activate`);
      setMsg('Election activated for voting');
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate election');
    }
  };

  const closeElection = async (id) => {
    if (!window.confirm('Close this election now and certify results?')) return;
    try {
      const res = await api.post(`/elections/${id}/close`);
      setMsg(res.data.message || 'Election closed and results certified');
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close election');
    }
  };

  const updateElectionSettings = async (id, settings) => {
    try {
      await api.put(`/elections/${id}`, { settings });
      setAllElections((prev) => prev.map((e) => (e._id === id ? { ...e, settings } : e)));
      showToast('Election options saved', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update election options');
    }
  };

  const addPosition = async () => {
    try {
      await api.post(`/elections/${positionForm.electionId}/positions`, {
        title: positionForm.title,
        seats: positionForm.seats,
        eligibility: {
          faculties: positionForm.faculties.split(',').map((s) => s.trim()),
          years: positionForm.years.split(',').map(Number),
        },
      });
      setMsg('Position added with eligibility rules');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add position');
    }
  };

  const search = async () => {
    try {
      const [users, candidates, applications, elections] = await Promise.all([
        api.get('/admin/users/search', { params: { q: searchQ } }),
        api.get('/admin/candidates/search', { params: { q: searchQ } }),
        api.get('/applications/search', { params: { q: searchQ } }),
        api.get('/elections/search', { params: { q: searchQ } }),
      ]);
      setSearchResults({
        users: users.data.users,
        candidates: candidates.data.candidates,
        applications: applications.data.applications,
        elections: elections.data.elections,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    }
  };

  const reviewApp = async (id, approve) => {
    try {
      if (approve) await api.post(`/applications/${id}/approve`);
      else await api.post(`/applications/${id}/reject`, { reason: 'Not selected' });
      setMsg(approve ? 'Application approved' : 'Application rejected');
      const appsRes = await api.get('/applications/search', { params: { status: 'pending' } });
      setSearchResults((s) => ({ ...s, applications: appsRes.data.applications }));
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to review application');
    }
  };

  const reviewAnomaly = async (id, status) => {
    let notes = '';
    if (status === 'flagged') {
      notes = window.prompt('Enter review notes (required when flagging):') || '';
      if (!notes.trim()) {
        setError('Review notes are required when flagging an anomaly');
        return;
      }
    }
    await api.post(`/admin/anomalies/${id}/review`, { status, notes });
    load(true);
  };

  const sendAnnouncement = async () => {
    try {
      const res = await api.post('/admin/announcements', announcementForm);
      setMsg(res.data.message);
      showToast(res.data.message, 'success');
      const lastRes = await api.get('/admin/announcements/last');
      setLastAnnouncement(lastRes.data.announcement);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send announcement');
    }
  };

  const resendAnnouncement = async () => {
    if (!lastAnnouncement?._id) return;
    try {
      const res = await api.post(`/admin/announcements/${lastAnnouncement._id}/resend`);
      setMsg(res.data.message);
      showToast(res.data.message, 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend announcement');
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  const generateVoters = async (count) => {
    setGenerating('voters');
    setError('');
    try {
      const res = await api.post('/admin/generate/voters', { count });
      setLastGeneratedUsers(res.data.users);
      setMsg(res.data.message);
      showToast(`Created ${res.data.users.length} voters — password: ${res.data.password}`, 'success');
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate voters');
    } finally {
      setGenerating('');
    }
  };

  const generateCandidates = async () => {
    if (!candidateElectionId) {
      setError('Select an election for candidate generation');
      return;
    }
    setGenerating('candidates');
    setError('');
    try {
      const res = await api.post('/admin/generate/candidates', {
        electionId: candidateElectionId,
        count: 5,
      });
      setMsg(res.data.message);
      showToast(res.data.message, 'success');
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate candidates');
    } finally {
      setGenerating('');
    }
  };

  const searchPromoteUsers = async () => {
    try {
      const res = await api.get('/admin/users/search', { params: { q: promoteQ } });
      setPromoteResults(res.data.users.filter((u) => u.role !== 'admin'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search users');
    }
  };

  const promoteToAdmin = async (userId) => {
    if (!window.confirm('Add this user as an administrator? Existing admins will keep their access.')) return;
    setPromotingId(userId);
    setError('');
    try {
      const res = await api.post(`/admin/users/${userId}/promote`);
      setMsg(res.data.message);
      if (res.data.warning) showToast(res.data.warning, 'warning');
      else showToast(res.data.message, 'success');
      const adminsRes = await api.get('/admin/users/admins');
      setAdmins(adminsRes.data.admins);
      setPromoteResults((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to promote user');
    } finally {
      setPromotingId('');
    }
  };

  const resetDemoElection = async () => {
    if (!window.confirm('Reset and create a fresh demo election? Existing auto-generated demo will be deleted.')) return;
    setGenerating('demo');
    setError('');
    try {
      const res = await api.post('/admin/generate/demo');
      setMsg(res.data.message);
      showToast(`Demo ready: ${res.data.election.title} (${res.data.election.status})`, 'success');
      load(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to seed demo election');
    } finally {
      setGenerating('');
    }
  };

  const statusColor = { draft: 'default', published: 'info', active: 'success', closed: 'warning', certified: 'primary' };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading admin dashboard" />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>Admin Dashboard</Typography>
        <IconButton onClick={() => load(true)} disabled={refreshing} aria-label="Refresh dashboard stats">
          {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      {msg && <Alert severity="success" onClose={() => setMsg('')} sx={{ mb: 2 }}>{msg}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            ['Voters', stats.stats.voters, null],
            ['Elections', stats.stats.elections, 0],
            ['Pending Applications', stats.stats.pendingApplications, 4],
            ['Pending Anomalies', stats.stats.pendingAnomalies, 5],
          ].map(([label, val, tabIndex]) => (
            <Grid item xs={6} md={3} key={label}>
              <Fade in={!refreshing} timeout={400}>
                <Card
                  sx={tabIndex != null ? { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } } : undefined}
                  onClick={tabIndex != null ? () => goToTab(tabIndex) : undefined}
                >
                  <CardContent>
                    <Typography variant="h4">{val}</Typography>
                    <Typography>{label}</Typography>
                    {tabIndex != null && (
                      <Typography variant="caption" color="text.secondary">Click to review</Typography>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {stats?.activeElections?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Live Turnout — Active Elections</Typography>
            {stats.activeElections.map((e) => (
              <Box key={e.electionId} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography>{e.title}</Typography>
                  <Chip label={`${e.turnoutPct || 0}% turnout`} color="success" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={Math.min(e.turnoutPct || 0, 100)} sx={{ height: 8, borderRadius: 4 }} />
                <Typography variant="caption">{e.uniqueVoterCount || 0} of {e.totalEligibleVoters || 0} eligible voters</Typography>
                <Button
                  size="small"
                  sx={{ mt: 1, mr: 1 }}
                  onClick={() => {
                    setResultsElectionId(e.electionId);
                    goToTab(1);
                  }}
                >
                  Admin results dashboard
                </Button>
                <Button
                  component={RouterLink}
                  to={`/live/${e.electionId}`}
                  size="small"
                  sx={{ mt: 1 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Public Live Results
                </Button>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Elections" />
        <Tab label="Results" />
        <Tab label="Search" />
        <Tab label="Admins" />
        <Tab label="Applications" />
        <Tab label="Anomalies" />
        <Tab label="Audit Logs" />
        <Tab label="Announcements" />
        <Tab label="Testing Tools" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card><CardContent>
              <Typography variant="h6">Create Election</Typography>
              <TextField fullWidth label="Title" margin="dense" onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })} />
              <TextField fullWidth label="Description" margin="dense" onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })} />
              <TextField fullWidth label="Start" type="datetime-local" margin="dense" InputLabelProps={{ shrink: true }} onChange={(e) => setElectionForm({ ...electionForm, startTime: e.target.value })} />
              <TextField fullWidth label="End" type="datetime-local" margin="dense" InputLabelProps={{ shrink: true }} onChange={(e) => setElectionForm({ ...electionForm, endTime: e.target.value })} />
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Stored ballot options</Typography>
              {[
                ['showLiveResultsPublic', 'Show public live results (/live)'],
                ['requireSelfieVerification', 'Require selfie verification on vote'],
                ['sendVoteConfirmationEmail', 'Send vote confirmation email'],
              ].map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={electionForm.settings[key]}
                      onChange={(e) => setElectionForm({
                        ...electionForm,
                        settings: { ...electionForm.settings, [key]: e.target.checked },
                      })}
                    />
                  }
                  label={label}
                />
              ))}
              <Button variant="contained" onClick={createElection} sx={{ mt: 1 }}>Create</Button>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card><CardContent>
              <Typography variant="h6">Add Position + Eligibility</Typography>
              <TextField fullWidth label="Election ID" margin="dense" onChange={(e) => setPositionForm({ ...positionForm, electionId: e.target.value })} />
              <TextField fullWidth label="Position Title" margin="dense" onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })} />
              <TextField fullWidth label="Eligible Faculties (comma)" margin="dense" value={positionForm.faculties} onChange={(e) => setPositionForm({ ...positionForm, faculties: e.target.value })} />
              <TextField fullWidth label="Eligible Years (comma)" margin="dense" value={positionForm.years} onChange={(e) => setPositionForm({ ...positionForm, years: e.target.value })} />
              <Button variant="contained" onClick={addPosition} sx={{ mt: 1 }}>Add Position</Button>
            </CardContent></Card>
          </Grid>
          {allElections.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">No elections yet — create one using the form above.</Alert>
            </Grid>
          )}
          {allElections.map((e) => (
            <Grid item xs={12} key={e._id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{e.title}</Typography>
                      <Typography variant="caption">{new Date(e.startTime).toLocaleString()} — {new Date(e.endTime).toLocaleString()}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={e.status} color={statusColor[e.status] || 'default'} size="small" />
                      {e.status === 'draft' && (
                        <Button size="small" variant="contained" onClick={() => publishElection(e._id)}>Publish</Button>
                      )}
                      {e.status === 'published' && (
                        <Button size="small" variant="contained" color="success" onClick={() => activateElection(e._id)}>Activate</Button>
                      )}
                      {['published', 'active'].includes(e.status) && (
                        <Button size="small" variant="outlined" color="warning" onClick={() => closeElection(e._id)}>Close Now</Button>
                      )}
                      {['published', 'active', 'closed', 'certified'].includes(e.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          component={RouterLink}
                          to={`/live/${e._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Public Live View
                        </Button>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Election / ballot stored options
                    </Typography>
                    {[
                      ['showLiveResultsPublic', 'Public live results'],
                      ['requireSelfieVerification', 'Selfie verification'],
                      ['sendVoteConfirmationEmail', 'Vote confirmation email'],
                    ].map(([key, label]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            size="small"
                            checked={e.settings?.[key] !== false}
                            onChange={(ev) => updateElectionSettings(e._id, {
                              showLiveResultsPublic: e.settings?.showLiveResultsPublic !== false,
                              requireSelfieVerification: e.settings?.requireSelfieVerification !== false,
                              sendVoteConfirmationEmail: e.settings?.sendVoteConfirmationEmail !== false,
                              [key]: ev.target.checked,
                            })}
                          />
                        }
                        label={label}
                      />
                    ))}
                  </Box>
                  {['closed', 'certified'].includes(e.status) && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" href={`/api/results/export/${e._id}/pdf`} target="_blank">Export PDF</Button>
                      <Button size="small" variant="outlined" href={`/api/results/export/${e._id}/excel`} target="_blank">Export Excel</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Election"
              value={resultsElectionId}
              onChange={(e) => setResultsElectionId(e.target.value)}
              sx={{ minWidth: 280 }}
            >
              <option value="">Select election…</option>
              {allElections.map((e) => (
                <option key={e._id} value={e._id}>{e.title} ({e.status})</option>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={resultsLoading ? <CircularProgress size={18} /> : <RefreshIcon />}
              onClick={() => loadResults(resultsElectionId)}
              disabled={!resultsElectionId || resultsLoading}
            >
              Refresh results
            </Button>
            {resultsElectionId && (
              <Button
                component={RouterLink}
                to={`/live/${resultsElectionId}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                Open public live view
              </Button>
            )}
          </Box>
          {resultsLoading && !resultsData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress aria-label="Loading election results" />
            </Box>
          ) : (
            <ElectionResultsView data={resultsData} error={resultsError} />
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              placeholder="Search voters, candidates, applications, elections..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              fullWidth
              aria-label="Admin search"
            />
            <Button variant="contained" onClick={search}>Search</Button>
          </Box>
          <Typography variant="h6">Users ({searchResults.users.length})</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>ID</TableCell><TableCell>Email</TableCell></TableRow></TableHead>
            <TableBody>
              {searchResults.users.length === 0 && (
                <TableRow><TableCell colSpan={3}>No users found — enter a search term above</TableCell></TableRow>
              )}
              {searchResults.users.map((u) => <TableRow key={u._id}><TableCell>{u.fullName}</TableCell><TableCell>{u.studentId}</TableCell><TableCell>{u.email}</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>Candidates ({searchResults.candidates.length})</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Position</TableCell></TableRow></TableHead>
            <TableBody>
              {searchResults.candidates.length === 0 && (
                <TableRow><TableCell colSpan={2}>No candidates found — enter a search term above</TableCell></TableRow>
              )}
              {searchResults.candidates.map((c) => <TableRow key={c._id}><TableCell>{c.displayName}</TableCell><TableCell>{c.positionId?.title}</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>Applications ({searchResults.applications.length})</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>Applicant</TableCell><TableCell>Position</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {searchResults.applications.length === 0 && (
                <TableRow><TableCell colSpan={3}>No applications found — enter a search term above</TableCell></TableRow>
              )}
              {searchResults.applications.map((a) => <TableRow key={a._id}><TableCell>{a.applicantId?.fullName}</TableCell><TableCell>{a.positionId?.title}</TableCell><TableCell>{a.status}</TableCell></TableRow>)}
            </TableBody>
          </Table>
          <Typography variant="h6" sx={{ mt: 2 }}>Elections ({searchResults.elections.length})</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.elections.length === 0 && (
                <TableRow><TableCell colSpan={4}>No elections found — enter a search term above</TableCell></TableRow>
              )}
              {searchResults.elections.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{e.title}</TableCell>
                  <TableCell><Chip label={e.status} size="small" color={statusColor[e.status] || 'default'} /></TableCell>
                  <TableCell>{new Date(e.startTime).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => { setResultsElectionId(e._id); goToTab(1); }}>Results</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {tab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card><CardContent>
              <Typography variant="h6" gutterBottom>Add administrator</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search by email or student ID, then add another admin. Existing administrators keep their access.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  placeholder="Email or student ID (e.g. s8114083@live.vu.edu.au)"
                  value={promoteQ}
                  onChange={(e) => setPromoteQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPromoteUsers()}
                  fullWidth
                  size="small"
                />
                <Button variant="contained" onClick={searchPromoteUsers}>Search</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promoteResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        {promoteQ ? 'No matching voters found — try another search' : 'Search for a user to promote'}
                      </TableCell>
                    </TableRow>
                  )}
                  {promoteResults.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.fullName}</TableCell>
                      <TableCell>{u.studentId}</TableCell>
                      <TableCell>
                        <Chip label={u.isVerified ? 'Yes' : 'No'} size="small" color={u.isVerified ? 'success' : 'warning'} />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          disabled={promotingId === u._id}
                          onClick={() => promoteToAdmin(u._id)}
                        >
                          {promotingId === u._id ? 'Adding…' : 'Add as Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined"><CardContent>
              <Typography variant="h6" gutterBottom>Current administrators ({admins.length})</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                All users with admin access on this website.
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        {adminsLoaded ? 'No administrators found' : 'Loading administrators…'}
                      </TableCell>
                    </TableRow>
                  )}
                  {admins.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.fullName}</TableCell>
                      <TableCell>{a.studentId}</TableCell>
                      <TableCell>{a.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {tab === 4 && (
        <Table>
          <TableHead><TableRow><TableCell>Applicant</TableCell><TableCell>Position</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {searchResults.applications.length === 0 && (
              <TableRow><TableCell colSpan={4}>No pending applications</TableCell></TableRow>
            )}
            {searchResults.applications.map((a) => (
              <TableRow key={a._id}>
                <TableCell>{a.applicantId?.fullName}</TableCell>
                <TableCell>{a.positionId?.title}</TableCell>
                <TableCell>{a.status}</TableCell>
                <TableCell>
                  {a.status === 'pending' && (
                    <>
                      <Button size="small" onClick={() => reviewApp(a._id, true)}>Approve</Button>
                      <Button size="small" color="error" onClick={() => reviewApp(a._id, false)}>Reject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 5 && (
        <Table>
          <TableHead><TableRow><TableCell>Voter</TableCell><TableCell>Score</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {anomalies.length === 0 && (
              <TableRow><TableCell colSpan={3}>No pending anomalies</TableCell></TableRow>
            )}
            {anomalies.map((a) => (
              <TableRow key={a._id}>
                <TableCell>{a.userId?.fullName} ({a.userId?.studentId})</TableCell>
                <TableCell>{a.faceMatchScore}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => reviewAnomaly(a._id, 'cleared')}>Clear</Button>
                  <Button size="small" color="error" onClick={() => reviewAnomaly(a._id, 'flagged')}>Flag</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 6 && (
        <Table size="small">
          <TableHead><TableRow><TableCell>Event</TableCell><TableCell>Time</TableCell><TableCell>Hash</TableCell></TableRow></TableHead>
          <TableBody>
            {auditLogs.length === 0 && (
              <TableRow><TableCell colSpan={3}>{auditLogsLoaded ? 'No audit log entries yet' : 'Loading audit logs…'}</TableCell></TableRow>
            )}
            {auditLogs.map((l) => (
              <TableRow key={l._id}><TableCell>{l.event}</TableCell><TableCell>{new Date(l.occurredAt).toLocaleString()}</TableCell><TableCell>{l.entryHash?.slice(0, 12)}...</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {tab === 7 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card><CardContent>
              <Typography variant="h6">Send Election Announcement</Typography>
              <TextField fullWidth label="Title" margin="dense" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
              <TextField fullWidth label="Message" margin="dense" multiline rows={4} value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} />
              <TextField fullWidth label="Election ID (optional — targets non-voters)" margin="dense" value={announcementForm.electionId} onChange={(e) => setAnnouncementForm({ ...announcementForm, electionId: e.target.value })} />
              <Button variant="contained" onClick={sendAnnouncement} sx={{ mt: 1 }} disabled={!announcementForm.title || !announcementForm.body}>
                Send to Voters
              </Button>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined"><CardContent>
              <Typography variant="h6">Last Announcement</Typography>
              {lastAnnouncement ? (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>{lastAnnouncement.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{lastAnnouncement.body}</Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    Sent {new Date(lastAnnouncement.sentAt).toLocaleString()} · {lastAnnouncement.recipientCount} recipients
                  </Typography>
                  <Button variant="outlined" onClick={resendAnnouncement}>Resend Notification</Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No announcements sent yet.</Typography>
              )}
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {tab === 8 && (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Development/Demo only — generates fake VU students. Not for production use.
          </Alert>
          {!generatorEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Test generator is disabled (production mode). Set ALLOW_TEST_GENERATOR=true in server .env to enable.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Generate Random Voters</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Creates verified voters with reference selfies. Default password: Test@12345
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[5, 10, 20].map((n) => (
                    <Button
                      key={n}
                      variant="contained"
                      disabled={!generatorEnabled || generating === 'voters'}
                      onClick={() => generateVoters(n)}
                    >
                      Generate {n} Random Test Voters
                    </Button>
                  ))}
                </Box>
              </CardContent></Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Generate Random Candidates</Typography>
                <TextField
                  fullWidth
                  select
                  SelectProps={{ native: true }}
                  label="Election"
                  margin="dense"
                  value={candidateElectionId}
                  onChange={(e) => setCandidateElectionId(e.target.value)}
                >
                  <option value="">Select election…</option>
                  {allElections.filter((e) => ['draft', 'published', 'active'].includes(e.status)).map((e) => (
                    <option key={e._id} value={e._id}>{e.title} ({e.status})</option>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  sx={{ mt: 1 }}
                  disabled={!generatorEnabled || generating === 'candidates'}
                  onClick={generateCandidates}
                >
                  Generate 5 Random Candidates
                </Button>
              </CardContent></Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Quick Demo Setup</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Resets the auto-generated demo election with positions and candidates, marked active.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!generatorEnabled || generating === 'demo'}
                  onClick={resetDemoElection}
                >
                  Reset &amp; Seed Demo Election
                </Button>
              </CardContent></Card>
            </Grid>

            {lastGeneratedUsers.length > 0 && (
              <Grid item xs={12}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="h6" gutterBottom>Last Generated Accounts</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student ID</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Password</TableCell>
                        <TableCell>Copy</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lastGeneratedUsers.map((u) => {
                        const line = `${u.studentId}\t${u.email}\t${u.password}`;
                        return (
                          <TableRow key={u.studentId}>
                            <TableCell>{u.studentId}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.password}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                aria-label={`Copy credentials for ${u.studentId}`}
                                onClick={() => copyText(line)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
