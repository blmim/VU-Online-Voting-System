import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Chip, Dialog, DialogContent, Divider, InputAdornment, List,
  ListItemButton, ListItemIcon, ListItemText, Skeleton, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BallotIcon from '@mui/icons-material/Ballot';
import PersonIcon from '@mui/icons-material/Person';
import PollIcon from '@mui/icons-material/Poll';
import PagesIcon from '@mui/icons-material/Pages';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../context/AuthContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { globalSearch } from '../services/searchService';
import { addRecentSearch, getRecentSearches } from '../utils/recentSearches';
import { phaseColor, phaseLabel, getElectionPhase } from '../utils/electionHelpers';
import { VU_GOLD, VU_NAVY } from '../theme';
import { useLiveRegion } from './LiveRegionAnnouncer';

function flattenResults({ pages, elections, candidates, polls }) {
  const items = [];
  pages.forEach((p) => items.push({ type: 'page', ...p }));
  elections.forEach((e) => items.push({ type: 'election', ...e }));
  candidates.forEach((c) => items.push({ type: 'candidate', ...c }));
  polls.forEach((p) => items.push({ type: 'poll', ...p }));
  return items;
}

function resultPath(item) {
  if (item.type === 'page') return item.path;
  if (item.type === 'election') return `/elections/${item._id}`;
  if (item.type === 'candidate') return `/candidates/${item.candidateId}`;
  if (item.type === 'poll') return `/polls/${item._id}`;
  return '/';
}

function resultLabel(item) {
  if (item.type === 'page') return item.label;
  if (item.type === 'election') return item.title;
  if (item.type === 'candidate') return item.displayName;
  if (item.type === 'poll') return item.title;
  return '';
}

function resultSubtitle(item) {
  if (item.type === 'page') return item.subtitle;
  if (item.type === 'election') return phaseLabel(getElectionPhase(item));
  if (item.type === 'candidate') return item.election?.title;
  if (item.type === 'poll') return 'Public prediction poll';
  return '';
}

function ResultIcon({ type }) {
  const sx = { color: 'primary.main' };
  if (type === 'page') return <PagesIcon sx={sx} />;
  if (type === 'election') return <BallotIcon sx={sx} />;
  if (type === 'candidate') return <PersonIcon sx={sx} />;
  return <PollIcon sx={sx} />;
}

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const searchRequestRef = useRef(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ pages: [], elections: [], candidates: [], polls: [] });
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState([]);
  const debounced = useDebouncedValue(query, 250);
  const { announce } = useLiveRegion();

  const items = flattenResults(results);

  const runSearch = useCallback(async (q, requestId) => {
    if (!q.trim()) {
      setResults({ pages: [], elections: [], candidates: [], polls: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(q, { authenticated: !!user });
      if (requestId !== searchRequestRef.current) return;
      setResults(data);
      setActiveIdx(0);
    } finally {
      if (requestId === searchRequestRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      setRecents(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ pages: [], elections: [], candidates: [], polls: [] });
      setActiveIdx(0);
    }
  }, [open]);

  useEffect(() => {
    searchRequestRef.current += 1;
    const requestId = searchRequestRef.current;
    runSearch(debounced, requestId);
  }, [debounced, runSearch]);

  useEffect(() => {
    if (!debounced.trim() || loading) return;
    const count = items.length;
    if (count === 0) {
      announce('No search results found');
    } else {
      announce(`${count} result${count === 1 ? '' : 's'} found`);
    }
  }, [items.length, debounced, loading, announce]);

  const go = (item) => {
    const path = resultPath(item);
    const label = resultLabel(item);
    addRecentSearch({ label, path, type: item.type });
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[activeIdx]) {
      e.preventDefault();
      go(items[activeIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const renderSection = (title, sectionItems, startIdx) => (
    sectionItems.length > 0 && (
      <Box key={title}>
        <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 700 }}>
          {title}
        </Typography>
        <List dense disablePadding>
          {sectionItems.map((item, i) => {
            const idx = startIdx + i;
            return (
              <ListItemButton
                key={`${item.type}-${item.id || item._id || item.candidateId}`}
                selected={idx === activeIdx}
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ResultIcon type={item.type} />
                </ListItemIcon>
                <ListItemText
                  primary={resultLabel(item)}
                  secondary={resultSubtitle(item)}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                {item.type === 'election' && (
                  <Chip
                    label={phaseLabel(getElectionPhase(item))}
                    size="small"
                    color={phaseColor(getElectionPhase(item))}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    )
  );

  const pageCount = results.pages.length;
  const electionCount = results.elections.length;
  const candidateCount = results.candidates.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `4px solid ${VU_GOLD}`,
          animation: 'vuFadeIn 0.2s ease',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1, bgcolor: VU_NAVY, color: 'white' }}>
        <Typography variant="subtitle1" fontWeight={700}>Search VU Voting</Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          Elections, candidates, polls, and pages — <kbd>Ctrl+K</kbd>
        </Typography>
      </Box>
      <DialogContent sx={{ p: 0 }} onKeyDown={handleKeyDown}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="Type to search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            autoComplete="off"
          />
        </Box>

        <Box sx={{ maxHeight: 400, overflowY: 'auto', pb: 1 }}>
          {loading && (
            <Box sx={{ px: 2 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1 }} />)}
            </Box>
          )}

          {!loading && !query.trim() && recents.length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 700 }}>
                Recent
              </Typography>
              <List dense disablePadding>
                {recents.map((r) => (
                  <ListItemButton key={r.path} onClick={() => { navigate(r.path); onClose(); }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><HistoryIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={r.label} secondary={r.path} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}

          {!loading && query.trim() && items.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No matches — try another name
            </Typography>
          )}

          {!loading && items.length > 0 && (
            <>
              {renderSection('Pages', results.pages, 0)}
              {pageCount > 0 && (electionCount > 0 || candidateCount > 0 || results.polls.length > 0) && <Divider />}
              {renderSection('Elections', results.elections, pageCount)}
              {electionCount > 0 && (candidateCount > 0 || results.polls.length > 0) && <Divider />}
              {renderSection('Candidates', results.candidates, pageCount + electionCount)}
              {candidateCount > 0 && results.polls.length > 0 && <Divider />}
              {renderSection('Polls', results.polls, pageCount + electionCount + candidateCount)}
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function useGlobalSearchShortcut(onOpen) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
