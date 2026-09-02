import {
  Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Link } from 'react-router-dom';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function InsightsPanel({ analysis, loading }) {
  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Box key={i} className="vu-shimmer" sx={{ height: 80, borderRadius: 2, mb: 2 }} />
        ))}
      </Box>
    );
  }

  if (!analysis) {
    return <Alert severity="info">Community insights will appear once discussion begins.</Alert>;
  }

  const { themes = [], wordCloud = [], candidateInsights = [], summaryParagraphs = [], disclaimer } = analysis;

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
          color: 'white',
          borderBottom: `3px solid ${VU_GOLD}`,
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: VU_GOLD }} />
            <Typography variant="h6" fontWeight={700}>Community Insights</Typography>
            <Chip label="AI-Powered Analysis" size="small" sx={{ bgcolor: VU_GOLD, color: VU_NAVY, fontWeight: 700 }} />
          </Stack>
          {summaryParagraphs.map((p) => (
            <Typography key={p} variant="body2" sx={{ opacity: 0.92, mb: 1, lineHeight: 1.7 }}>
              {p}
            </Typography>
          ))}
          {disclaimer && (
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
              {disclaimer}
            </Typography>
          )}
        </CardContent>
      </Card>

      {wordCloud.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Top themes</Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
              {wordCloud.map((w) => (
                <Chip
                  key={w.word}
                  label={`${w.word} (${w.weight})`}
                  sx={{
                    fontSize: `${0.75 + Math.min(w.weight, 10) * 0.05}rem`,
                    bgcolor: 'rgba(0,51,102,0.08)',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
        Why voters are choosing…
      </Typography>
      <Stack spacing={2}>
        {candidateInsights.map((c) => (
          <Card key={c.candidateId} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  component={c.candidateId ? Link : 'span'}
                  to={c.candidateId ? `/candidates/${c.candidateId}` : undefined}
                  sx={c.candidateId ? { textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } } : {}}
                >
                  {c.displayName}
                </Typography>
                {c.candidateId && (
                  <Button component={Link} to={`/candidates/${c.candidateId}`} size="small" variant="outlined">
                    View profile
                  </Button>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, mt: 0.5 }}>
                {c.summary}
              </Typography>
              {c.mentionPct > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Mention rate</Typography>
                    <Typography variant="caption" fontWeight={700}>{c.mentionPct}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(c.mentionPct, 100)}
                    sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: VU_GOLD } }}
                  />
                </Box>
              )}
              {c.supportReason && (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                  {c.supportReason}
                </Typography>
              )}
              {c.matchedThemes?.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {c.matchedThemes.map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
