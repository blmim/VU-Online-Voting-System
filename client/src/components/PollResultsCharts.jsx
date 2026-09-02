import {
  Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Avatar, Box, LinearProgress, Stack, Typography } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

const CHART_COLORS = [VU_NAVY, VU_GOLD, '#2E7D32', '#C62828', '#5C6BC0', '#00838F'];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2">{row.displayName}</Typography>
      <Typography variant="body2">{row.voteCount} responses ({row.votePct}%)</Typography>
    </Box>
  );
}

export function PollProgressBars({ results, leaderId }) {
  if (!results?.length) {
    return <Typography color="text.secondary">No responses yet.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {results.map((r, i) => {
        const isLeader = String(r.optionId) === String(leaderId) || i === 0;
        return (
          <Box key={r.optionId}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Avatar src={r.photoUrl || undefined} alt="" sx={{ width: 36, height: 36, border: isLeader ? `2px solid ${VU_GOLD}` : 'none' }} />
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={isLeader ? 700 : 500}>{r.displayName}</Typography>
                  <Typography variant="body2" fontWeight={700} color={isLeader ? 'secondary.dark' : 'text.secondary'}>
                    {r.votePct}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={r.votePct}
                  aria-label={`${r.displayName}: ${r.votePct}%`}
                  sx={{
                    mt: 0.5,
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      bgcolor: isLeader ? VU_GOLD : CHART_COLORS[i % CHART_COLORS.length],
                      transition: 'transform 0.6s ease',
                    },
                  }}
                />
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function PollResultsCharts({ results }) {
  const data = results || [];
  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No poll data to display yet.
      </Typography>
    );
  }

  const leaderId = data[0]?.optionId;

  return (
    <Box>
      <PollProgressBars results={data} leaderId={leaderId} />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 4 }}>
        <Box sx={{ flex: 1, minHeight: 280 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Bar chart</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <XAxis dataKey="displayName" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={56} />
              <YAxis allowDecimals={false} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="voteCount" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
                {data.map((entry, i) => (
                  <Cell key={entry.optionId} fill={i === 0 ? VU_GOLD : CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ flex: 1, minHeight: 280 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Share breakdown</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="voteCount"
                nameKey="displayName"
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                isAnimationActive
                animationDuration={600}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.optionId} fill={i === 0 ? VU_GOLD : CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Box>
  );
}
