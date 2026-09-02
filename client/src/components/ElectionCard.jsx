import { Link } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Stack, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EventIcon from '@mui/icons-material/Event';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  formatElectionDates, getElectionPhase, isVotingOpen, phaseColor, phaseLabel,
} from '../utils/electionHelpers';
import { VU_GOLD } from '../theme';
import ClickableTooltip from './ClickableTooltip';

export default function ElectionCard({ election, hasVoted, showVote = true, canVote = true }) {
  const phase = getElectionPhase(election);
  const open = isVotingOpen(election);
  const title = election.title;

  return (
    <Card
      className="vu-premium-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `4px solid ${open ? VU_GOLD : 'transparent'}`,
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip label={phaseLabel(phase)} color={phaseColor(phase)} size="small" />
          <Chip label={election.status} size="small" variant="outlined" />
          {hasVoted && <Chip label="You voted" size="small" color="default" />}
        </Stack>

        <ClickableTooltip title={`View election hub — ${title}`} fullWidth>
          <Typography
            variant="h6"
            component={Link}
            to={`/elections/${election._id}`}
            gutterBottom
            color="primary.main"
            fontWeight={700}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {title}
          </Typography>
        </ClickableTooltip>

        {election.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
            {election.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
          <EventIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
          <Typography variant="body2" color="text.secondary">
            {formatElectionDates(election.startTime, election.endTime)}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          {!showVote && open && (
            <ClickableTooltip title={`Sign in to cast your vote in ${title}`} fullWidth>
              <Button component={Link} to="/login/student" variant="contained" fullWidth startIcon={<HowToVoteIcon />}>
                Sign in to vote
              </Button>
            </ClickableTooltip>
          )}
          {showVote && open && canVote && (
            <ClickableTooltip
              title={hasVoted
                ? `Review your ballot for ${title}`
                : `Cast your vote in ${title}`}
              fullWidth
            >
              <Button
                component={Link}
                to={`/vote/${election._id}`}
                variant="contained"
                fullWidth
                startIcon={<HowToVoteIcon />}
                color={hasVoted ? 'inherit' : 'primary'}
              >
                {hasVoted ? 'View ballot / vote again' : 'Cast your vote'}
              </Button>
            </ClickableTooltip>
          )}
          {showVote && open && !canVote && (
            <Button
              component={Link}
              to="/profile"
              variant="contained"
              fullWidth
              startIcon={<VerifiedUserIcon />}
              color="warning"
            >
              Verify email to vote
            </Button>
          )}
          {!open && phase === 'upcoming' && (
            <Button variant="outlined" fullWidth disabled>
              Voting opens {new Date(election.startTime).toLocaleDateString()}
            </Button>
          )}
          <ClickableTooltip title={`Election hub — candidates, discussion, insights for ${title}`} fullWidth>
            <Button component={Link} to={`/elections/${election._id}`} variant="outlined" fullWidth size="small">
              Election hub
            </Button>
          </ClickableTooltip>
          <ClickableTooltip
            title={phase === 'finished'
              ? `View final results for ${title}`
              : `View live results for ${title}`}
            fullWidth
          >
            <Button
              component={Link}
              to={`/live/${election._id}`}
              variant="outlined"
              fullWidth
              size="small"
              startIcon={<LiveTvIcon />}
            >
              {phase === 'finished' ? 'View results' : 'Live results'}
            </Button>
          </ClickableTooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
