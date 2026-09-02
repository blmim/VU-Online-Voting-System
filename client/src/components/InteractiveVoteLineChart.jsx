import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

const COLORS = [VU_NAVY, VU_GOLD, '#2E7D32', '#C62828', '#5C6BC0', '#00838F'];

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 3, border: 1, borderColor: 'divider', maxWidth: 260 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>{label}</Typography>
      {payload.map((p) => (
        <Typography key={p.dataKey} variant="body2" sx={{ color: p.color }}>
          {p.dataKey}: {p.value} vote{p.value === 1 ? '' : 's'}
        </Typography>
      ))}
    </Box>
  );
}

export default function InteractiveVoteLineChart({ timeline = [], candidates = [], title, height = 280 }) {
  const names = candidates.map((c) => c.displayName).filter(Boolean);

  if (!timeline.length || !names.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        Vote timeline will appear as ballots are cast.
      </Typography>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={timeline} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} width={36} />
          <Tooltip content={<TimelineTooltip />} />
          <Legend />
          {names.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 7 }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
