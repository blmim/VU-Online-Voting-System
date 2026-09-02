import {
  Avatar, Box, Chip, ClickAwayListener, Divider, InputAdornment, List,
  ListItemButton, ListItemText, Paper, Skeleton, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BallotIcon from '@mui/icons-material/Ballot';
import PersonIcon from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import { formatElectionDates, phaseColor, phaseLabel, getElectionPhase } from '../utils/electionHelpers';
import { VU_GOLD } from '../theme';

function ShimmerRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ px: 2, py: 1 }}>
          <Skeleton variant="rounded" height={48} />
        </Box>
      ))}
    </>
  );
}

function SectionHeader({ label }) {
  return (
    <Typography
      variant="overline"
      sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 700 }}
    >
      {label}
    </Typography>
  );
}

export default function LiveSearchDropdown({
  value,
  onChange,
  onClear,
  placeholder = 'Search elections or candidates…',
  elections = [],
  candidateMatches = [],
  loading = false,
  open = false,
  onOpenChange,
  onSelectElection,
  onSelectCandidate,
  inputProps = {},
  sx,
}) {
  const hasQuery = value.trim().length > 0;
  const showPanel = open && hasQuery;
  const isEmpty = !loading && elections.length === 0 && candidateMatches.length === 0;

  return (
    <ClickAwayListener onClickAway={() => onOpenChange?.(false)}>
      <Box sx={{ position: 'relative', flex: 1, ...sx }}>
        <TextField
          size="small"
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onOpenChange?.(true);
          }}
          onFocus={() => onOpenChange?.(true)}
          aria-label="Search"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={onClear} aria-label="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            ...inputProps,
          }}
        />

        {showPanel && (
          <Paper
            role="listbox"
            elevation={8}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 380,
              overflowY: 'auto',
              animation: 'vuFadeIn 0.2s ease',
              borderTop: `3px solid ${VU_GOLD}`,
            }}
          >
            {loading && <ShimmerRows />}

            {!loading && isEmpty && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No matches — try another name
              </Typography>
            )}

            {!loading && elections.length > 0 && (
              <>
                <SectionHeader label="Elections" />
                <List dense disablePadding>
                  {elections.slice(0, 6).map((e) => {
                    const phase = getElectionPhase(e);
                    return (
                      <ListItemButton
                        key={e._id}
                        onClick={() => onSelectElection?.(e)}
                        sx={{ py: 1 }}
                      >
                        <BallotIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                        <ListItemText
                          primary={e.title}
                          secondary={formatElectionDates(e.startTime, e.endTime)}
                          primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                        />
                        <Chip label={phaseLabel(phase)} size="small" color={phaseColor(phase)} sx={{ ml: 1 }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </>
            )}

            {!loading && candidateMatches.length > 0 && (
              <>
                {elections.length > 0 && <Divider />}
                <SectionHeader label="Candidates" />
                <List dense disablePadding>
                  {candidateMatches.slice(0, 6).map((m) => (
                    <ListItemButton
                      key={m.candidateId || `${m.displayName}-${m.election?._id}`}
                      onClick={() => onSelectCandidate?.(m)}
                      sx={{ py: 1 }}
                    >
                      <Avatar
                        src={m.photoUrl || undefined}
                        alt=""
                        sx={{ width: 32, height: 32, mr: 1.5, border: `2px solid ${VU_GOLD}` }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <ListItemText
                        primary={m.displayName}
                        secondary={m.positions?.length
                          ? `${m.election?.title} · ${m.positions.join(', ')}`
                          : m.election?.title}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
