import {
  Alert, Avatar, Box, Card, CardContent, Chip, Stack, Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import { VU_GOLD } from '../theme';

const CONFIDENCE_COLOR = { high: 'success', medium: 'warning', low: 'default' };

export default function PollAnalysisPanel({ analysis }) {
  if (!analysis) return null;

  const { likelyWinner, confidence, margin, leader, runnerUp, insights, sentimentSummary, totalVotes } = analysis;

  return (
    <Card sx={{ borderTop: `4px solid ${VU_GOLD}` }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <InsightsIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Analysis</Typography>
          <Chip label={`${totalVotes} response${totalVotes === 1 ? '' : 's'}`} size="small" />
        </Stack>

        <Alert severity="info" icon={false} sx={{ mb: 2, bgcolor: 'rgba(0,51,102,0.06)' }}>
          <Typography variant="caption" fontWeight={700} display="block" color="primary">
            Public opinion poll — not an official vote
          </Typography>
        </Alert>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(212,175,55,0.12)', border: `1px solid ${VU_GOLD}` }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {leader?.photoUrl && (
                <Avatar src={leader.photoUrl} alt="" sx={{ width: 48, height: 48, border: `2px solid ${VU_GOLD}` }} />
              )}
              <Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EmojiEventsIcon sx={{ color: VU_GOLD, fontSize: 20 }} />
                  <Typography variant="overline" color="text.secondary">Likely winner</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800}>{likelyWinner}</Typography>
                {leader && (
                  <Typography variant="body2" color="text.secondary">{leader.votePct}% of predictions</Typography>
                )}
              </Box>
            </Stack>
            <Chip
              label={`${confidence} confidence`}
              size="small"
              color={CONFIDENCE_COLOR[confidence] || 'default'}
              sx={{ mt: 1 }}
            />
          </Box>

          {runnerUp && (
            <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                <TrendingUpIcon fontSize="small" color="action" />
                <Typography variant="overline" color="text.secondary">Margin</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>{margin}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Lead over {runnerUp.displayName} ({runnerUp.votePct}%)
              </Typography>
            </Box>
          )}
        </Stack>

        {insights?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Key insights</Typography>
            {insights.map((text) => (
              <Typography key={text} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>• {text}</Typography>
            ))}
          </Box>
        )}

        {sentimentSummary?.some((s) => s.totalMentions > 0) && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Discussion sentiment</Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
              {sentimentSummary.filter((s) => s.totalMentions > 0).map((s) => (
                <Chip
                  key={s.displayName}
                  size="small"
                  label={`${s.displayName}: ${s.dominant}`}
                  color={s.dominant === 'positive' ? 'success' : s.dominant === 'negative' ? 'error' : 'default'}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
