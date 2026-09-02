import {
  Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

const CHART_COLORS = [VU_NAVY, VU_GOLD, '#2E7D32', '#C62828', '#5C6BC0', '#00838F', '#6A1B9A', '#EF6C00'];
const PIE_CHART_HEIGHT = 360;
const BAR_LINE_HEIGHT = 280;

export const CHART_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'pie', label: 'Pie' },
  { value: 'donut', label: 'Donut' },
  { value: 'line', label: 'Line' },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, boxShadow: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2">{row.displayName}</Typography>
      <Typography variant="body2">{row.voteCount} votes ({row.votePct ?? 0}%)</Typography>
    </Box>
  );
}

function legendFormatter(value, entry) {
  const { votePct, voteCount } = entry.payload || {};
  const pct = votePct ?? 0;
  const votes = voteCount ?? 0;
  return `${value} — ${pct}% (${votes} vote${votes === 1 ? '' : 's'})`;
}

function axisTickProps(count) {
  if (count <= 3) {
    return { angle: 0, textAnchor: 'middle', height: 48 };
  }
  if (count <= 6) {
    return { angle: -30, textAnchor: 'end', height: 72 };
  }
  return { angle: -45, textAnchor: 'end', height: 88 };
}

export default function VoteResultsChart({ candidates, chartType = 'bar', positionTitle, height }) {
  const data = candidates || [];

  if (!data.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No candidate data to chart for this position.
      </Typography>
    );
  }

  const ariaLabel = `${chartType} chart showing votes for ${positionTitle}`;
  const axisTicks = axisTickProps(data.length);
  const chartMargin = { top: 12, right: 24, left: 8, bottom: axisTicks.height };

  if (chartType === 'pie' || chartType === 'donut') {
    const useVerticalLegend = data.length > 3;
    const pieHeight = height ?? PIE_CHART_HEIGHT;
    const legendBottom = useVerticalLegend ? 12 : 8;

    return (
      <ResponsiveContainer width="100%" height={pieHeight}>
        <PieChart
          aria-label={ariaLabel}
          margin={{ top: 16, right: 24, left: 24, bottom: useVerticalLegend ? 24 : 56 }}
        >
          <Pie
            data={data}
            dataKey="voteCount"
            nameKey="displayName"
            cx="50%"
            cy={useVerticalLegend ? '46%' : '42%'}
            outerRadius={chartType === 'donut' ? 76 : 86}
            innerRadius={chartType === 'donut' ? 42 : 0}
            label={false}
            labelLine={false}
            paddingAngle={data.length > 1 ? 2 : 0}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.candidateId || i}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            layout={useVerticalLegend ? 'vertical' : 'horizontal'}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{
              paddingTop: 20,
              lineHeight: '1.5',
              width: '100%',
              left: 0,
              bottom: legendBottom,
            }}
            formatter={legendFormatter}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height ?? BAR_LINE_HEIGHT}>
        <LineChart data={data} margin={chartMargin} aria-label={ariaLabel}>
          <XAxis
            dataKey="displayName"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={axisTicks.angle}
            textAnchor={axisTicks.textAnchor}
            height={axisTicks.height}
          />
          <YAxis allowDecimals={false} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="voteCount"
            stroke={VU_NAVY}
            strokeWidth={2}
            dot={{ fill: VU_GOLD, r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height ?? BAR_LINE_HEIGHT}>
      <BarChart data={data} margin={chartMargin} aria-label={ariaLabel}>
        <XAxis
          dataKey="displayName"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={axisTicks.angle}
          textAnchor={axisTicks.textAnchor}
          height={axisTicks.height}
        />
        <YAxis allowDecimals={false} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="voteCount" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={entry.candidateId || i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
