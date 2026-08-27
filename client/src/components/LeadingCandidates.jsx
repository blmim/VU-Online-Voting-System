import {
  Box, Card, CardContent, Grid, Typography, Chip, Avatar, Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { VU_GOLD, VU_NAVY } from '../theme';

function getLeaders(positions) {
  return (positions || []).map((pos) => {
    const seats = pos.seats || 1;
    const sorted = [...(pos.candidates || [])].sort((a, b) => b.voteCount - a.voteCount);
    const leaders = sorted.slice(0, seats);
    const total = pos.totalVotes || sorted.reduce((s, c) => s + (c.voteCount || 0), 0);
    return { position: pos, leaders, total, seats };
  });
}

export default function LeadingCandidates({ positions }) {
  const leadersByPosition = getLeaders(positions);

  if (!leadersByPosition.length) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEventsIcon sx={{ color: 'secondary.main' }} />
          <Typography variant="h6" component="h2">Leading candidates</Typography>
          <Tooltip title="Top vote-getters per position based on current counts. Winners are determined by highest votes; ties broken at certification.">
            <Chip label="Live standings" size="small" sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 600 }} />
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          {leadersByPosition.map(({ position, leaders, total, seats }) => (
            <Grid item xs={12} sm={6} md={4} key={position._id || position.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {position.title}
                    <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                      ({seats} seat{seats > 1 ? 's' : ''} · {total} votes cast)
                    </Typography>
                  </Typography>
                  {leaders.map((c, i) => (
                    <Box
                      key={c.candidateId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1,
                        borderTop: i > 0 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: i === 0 ? VU_GOLD : VU_NAVY,
                          color: i === 0 ? VU_NAVY : 'white',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {i === 0 ? '1' : i + 1}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={i === 0 ? 700 : 500} noWrap>
                          {c.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.voteCount} votes · {c.votePct ?? 0}%
                          {total > 0 && ` · ${Math.round((c.voteCount / total) * 100)}% of position`}
                        </Typography>
                      </Box>
                      {i === 0 && c.voteCount > 0 && (
                        <Chip label="Leading" size="small" color="secondary" sx={{ fontWeight: 600 }} />
                      )}
                    </Box>
                  ))}
                  {leaders.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No votes yet</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
