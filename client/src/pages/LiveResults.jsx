import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import {

  Alert, Box, Chip, MenuItem, Stack, TextField, Typography,

} from '@mui/material';

import { io } from 'socket.io-client';

import api from '../services/api';

import ElectionResultsView from '../components/ElectionResultsView';

import LiveSearchDropdown from '../components/LiveSearchDropdown';

import SecureTabs from '../components/SecureTabs';

import useDebouncedValue from '../hooks/useDebouncedValue';

import { searchResultsPage } from '../services/searchService';

import { addRecentSearch } from '../utils/recentSearches';

import { getElectionPhase, phaseColor, phaseLabel } from '../utils/electionHelpers';

import { VU_NAVY, VU_GOLD } from '../theme';



const PHASE_TABS = [

  { value: 'all', label: 'All', tooltip: 'All elections with public results' },

  { value: 'active', label: 'Voting open', tooltip: 'Live results for open elections' },

  { value: 'upcoming', label: 'Upcoming', tooltip: 'Elections not yet started' },

  { value: 'finished', label: 'Finished', tooltip: 'Certified and closed elections' },

];



export default function LiveResults() {

  const { id: paramId } = useParams();

  const navigate = useNavigate();

  const [allElections, setAllElections] = useState([]);

  const [elections, setElections] = useState([]);

  const [electionId, setElectionId] = useState(paramId || '');

  const [data, setData] = useState(null);

  const [error, setError] = useState('');

  const [listError, setListError] = useState('');

  const [search, setSearch] = useState('');

  const [phaseTab, setPhaseTab] = useState('all');

  const [candidateMatches, setCandidateMatches] = useState([]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);



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

    api.get('/elections/public')

      .then((r) => {

        const list = r.data.elections || [];

        setAllElections(list);

        setElections(list);

        if (!paramId && list[0]) {

          setElectionId(list[0]._id);

          navigate(`/live/${list[0]._id}`, { replace: true });

        }

      })

      .catch(() => setListError('Could not load elections. Please try again.'));

  }, [navigate, paramId]);



  useEffect(() => {

    if (paramId) setElectionId(paramId);

  }, [paramId]);



  useEffect(() => {

    if (!electionId) return undefined;

    load(electionId);

    const token = localStorage.getItem('token');

    const socket = io('/', {

      path: '/socket.io',

      withCredentials: true,

      auth: token ? { token } : undefined,

    });

    const refresh = () => load(electionId);

    socket.on('vote:update', refresh);

    socket.on('election:certified', refresh);

    socket.emit('join:election', electionId);

    const interval = setInterval(refresh, 30000);

    return () => { socket.disconnect(); clearInterval(interval); };

  }, [electionId]);



  useEffect(() => {

    if (!debouncedSearch.trim()) {

      setElections(allElections);

      setCandidateMatches([]);

      setSearchLoading(false);

      return undefined;

    }



    let cancelled = false;

    setSearchLoading(true);

    searchResultsPage(debouncedSearch, phaseTab)

      .then((res) => {

        if (cancelled) return;

        setElections(res.elections);

        setCandidateMatches(res.candidateMatches);

        if (res.elections.length > 0) {

          const nextId = res.elections[0]._id;

          setElectionId(nextId);

          navigate(`/live/${nextId}`);

        }

      })

      .catch(() => {

        if (!cancelled) setError('Search failed');

      })

      .finally(() => {

        if (!cancelled) setSearchLoading(false);

      });

    return () => { cancelled = true; };

  }, [debouncedSearch, phaseTab, allElections, navigate]);



  const filteredElections = useMemo(() => elections.filter((e) => {
    const phase = getElectionPhase(e);
    if (phaseTab !== 'all' && phase !== phaseTab) return false;
    return true;
  }), [elections, phaseTab]);



  useEffect(() => {

    if (filteredElections.length === 0) return;

    const stillValid = filteredElections.some((e) => e._id === electionId);

    if (!stillValid) {

      const nextId = filteredElections[0]._id;

      setElectionId(nextId);

      navigate(`/live/${nextId}`);

    }

  }, [filteredElections, electionId, navigate]);



  const selectedElection = elections.find((e) => e._id === electionId);

  const selectValue = filteredElections.some((e) => e._id === electionId)

    ? electionId

    : (filteredElections[0]?._id || '');



  const handleSelectElection = (e) => {

    addRecentSearch({ label: e.title, path: `/live/${e._id}`, type: 'election' });

    setElectionId(e._id);

    setDropdownOpen(false);

    navigate(`/live/${e._id}`);

  };



  const handleSelectCandidate = (m) => {

    if (m.candidateId) {

      addRecentSearch({ label: m.displayName, path: `/candidates/${m.candidateId}`, type: 'candidate' });

      setDropdownOpen(false);

      navigate(`/candidates/${m.candidateId}`);

      return;

    }

    if (m.election?._id) {

      setElectionId(m.election._id);

      setDropdownOpen(false);

      navigate(`/live/${m.election._id}`);

    }

  };



  const handleClearSearch = () => {

    setSearch('');

    setDropdownOpen(false);

    setElections(allElections);

    setCandidateMatches([]);

  };



  return (

    <Box>

      <Box

        sx={{

          mb: 3,

          p: 3,

          borderRadius: 3,

          background: `linear-gradient(135deg, ${VU_NAVY}, #004080)`,

          color: 'white',

          borderBottom: `3px solid ${VU_GOLD}`,

        }}

      >

        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>

          Election results

        </Typography>

        <Typography sx={{ opacity: 0.9 }}>

          Search by election name or candidate — results update as you type.

        </Typography>

      </Box>



      {(listError || error) && (

        <Alert severity="error" sx={{ mb: 2 }}>{listError || error}</Alert>

      )}



      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>

        <LiveSearchDropdown

          value={search}

          onChange={setSearch}

          onClear={handleClearSearch}

          elections={elections}

          candidateMatches={candidateMatches}

          loading={searchLoading && !!search.trim()}

          open={dropdownOpen}

          onOpenChange={setDropdownOpen}

          onSelectElection={handleSelectElection}

          onSelectCandidate={handleSelectCandidate}

        />

      </Stack>



      <SecureTabs

        value={phaseTab}

        onChange={(_, v) => setPhaseTab(v)}

        tabs={PHASE_TABS}

        aria-label="Filter results by election phase"

      />



      <TextField

        select

        label="Election"

        value={selectValue}

        onChange={(e) => {

          setElectionId(e.target.value);

          navigate(`/live/${e.target.value}`);

        }}

        sx={{ mb: 2, minWidth: 280 }}

        fullWidth

      >

        {filteredElections.length === 0 && (

          <MenuItem value="" disabled>No elections match</MenuItem>

        )}

        {filteredElections.map((e) => (

          <MenuItem key={e._id} value={e._id}>

            {e.title} ({phaseLabel(getElectionPhase(e))})

          </MenuItem>

        ))}

      </TextField>



      {selectedElection && (

        <Chip

          label={phaseLabel(getElectionPhase(selectedElection))}

          color={phaseColor(getElectionPhase(selectedElection))}

          sx={{ mb: 2 }}

        />

      )}



      <ElectionResultsView data={data} error={error} />

    </Box>

  );

}


