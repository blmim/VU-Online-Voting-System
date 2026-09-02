import {
  Box, Card, CardContent, Grid, Tooltip, Typography, Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinearProgress from '@mui/material/LinearProgress';

function MetricCard({ label, value, hint, accent }) {
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Card variant="outlined" sx={{ height: '100%', borderColor: accent ? 'secondary.main' : 'divider' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            {hint && (
              <Tooltip title={hint} arrow>
                <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
              </Tooltip>
            )}
          </Box>
          <Typography variant="h5" fontWeight={700} color={accent ? 'primary.main' : 'text.primary'}>
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default function VoteMetricsPanel({ data, election }) {
  if (!data) return null;

  const totalBallotVotes = (data.positions || []).reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const positionCount = data.positions?.length || 0;
  const status = election?.status || 'unknown';
  const isCertified = status === 'certified' || status === 'closed';
  const statusLabel = status === 'active' ? 'Voting open' : status === 'certified' ? 'Certified' : status;

  return (
    <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'secondary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Box>
            <Typography variant="h6">Vote calculation summary</Typography>
            <Typography variant="body2" color="text.secondary">
              How votes are counted for this election
            </Typography>
          </Box>
          <Chip
            label={statusLabel}
            color={status === 'active' ? 'success' : isCertified ? 'primary' : 'default'}
            size="small"
          />
        </Box>

        <Grid container spacing={1.5}>
          <MetricCard
            label="Turnout"
            value={`${data.turnoutPct ?? 0}%`}
            hint="Unique voters who cast at least one ballot ÷ eligible registered voters × 100"
            accent
          />
          <MetricCard
            label="Unique voters"
            value={data.uniqueVoterCount ?? 0}
            hint="Distinct student accounts that submitted at least one vote in this election"
          />
          <MetricCard
            label="Eligible voters"
            value={data.totalEligibleVoters ?? 0}
            hint="Verified student accounts eligible to participate when the election was configured"
          />
          <MetricCard
            label="Total ballot votes"
            value={totalBallotVotes}
            hint="Sum of votes across all positions (one vote per position per voter)"
          />
          <MetricCard
            label="Positions"
            value={positionCount}
            hint="Number of offices on the ballot"
          />
          <MetricCard
            label="Avg votes / voter"
            value={
              data.uniqueVoterCount
                ? (totalBallotVotes / data.uniqueVoterCount).toFixed(1)
                : '0'
            }
            hint="Total ballot votes divided by unique voters — shows how many positions voters filled"
          />
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Turnout progress</Typography>
            <Typography variant="body2" fontWeight={600}>{data.turnoutPct ?? 0}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(data.turnoutPct ?? 0, 100)}
            sx={{ height: 10, borderRadius: 5 }}
            aria-label={`Turnout ${data.turnoutPct} percent`}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {data.uniqueVoterCount ?? 0} of {data.totalEligibleVoters ?? 0} eligible voters have voted
            {data.asOf ? ` · Updated ${new Date(data.asOf).toLocaleString()}` : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
