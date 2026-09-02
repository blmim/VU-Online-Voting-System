import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function useCandidateStatus() {
  const { user } = useAuth();
  const [isCandidate, setIsCandidate] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsCandidate(false);
      setCandidates([]);
      return;
    }
    setLoading(true);
    api.get('/candidates/me/status')
      .then((r) => {
        setIsCandidate(r.data.isCandidate);
        setCandidates(r.data.candidates || []);
      })
      .catch(() => {
        setIsCandidate(false);
        setCandidates([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return { isCandidate, candidates, loading };
}
