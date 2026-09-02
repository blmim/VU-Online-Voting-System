import { useState } from 'react';
import {
  Alert, Avatar, Box, Card, CardContent, Chip, FormControl, InputLabel, MenuItem,
  Select, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import VoteMetricsPanel from './VoteMetricsPanel';
import LeadingCandidates from './LeadingCandidates';
import ChampionshipScoreboard from './ChampionshipScoreboard';
import InteractiveVoteLineChart from './InteractiveVoteLineChart';
import VoteResultsChart, { CHART_TYPES } from './VoteResultsChart';

export default function ElectionResultsView({
  data,
  error,
  chartType: controlledChartType,
  onChartTypeChange,
  showCountingHelp = true,
  timeline,
}) {
  const [internalChartType, setInternalChartType] = useState('bar');
  const chartType = controlledChartType ?? internalChartType;
  const setChartType = onChartTypeChange ?? setInternalChartType;

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  if (!data) return null;

  const isPreliminary = data.election?.status === 'active';

  return (
    <>
      {isPreliminary ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Preliminary results — voting is still in progress. Counts update as ballots are cast.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          {data.election?.status === 'certified'
            ? 'Official certified results'
            : 'Results shown after voting has ended'}
        </Alert>
      )}

      <VoteMetricsPanel data={data} election={data.election} />
      <LeadingCandidates positions={data.positions} />

      {data.positions?.slice(0, 2).map((pos) => (
        <Box key={pos._id || pos.title} sx={{ mb: 3 }}>
          <ChampionshipScoreboard
            title={pos.title}
            subtitle="Head-to-head championship matchup"
            fighters={pos.candidates}
          />
        </Box>
      ))}

      {timeline?.positions?.[0] && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <InteractiveVoteLineChart
              title={`${timeline.positions[0].title} — vote momentum`}
              timeline={timeline.positions[0].timeline}
              candidates={timeline.positions[0].candidates}
            />
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h6" component="h2">Results by position</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="chart-type-label">Chart type</InputLabel>
          <Select
            labelId="chart-type-label"
            label="Chart type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            {CHART_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          size="small"
          value={chartType}
          exclusive
          onChange={(_, v) => v && setChartType(v)}
          aria-label="Chart type"
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          {CHART_TYPES.map((t) => (
            <ToggleButton key={t.value} value={t.value} aria-label={`${t.label} chart`}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {showCountingHelp && (
        <Alert severity="info" icon={<BarChartIcon />} sx={{ mb: 2 }}>
          Each verified voter may cast one vote per position. Percentages are calculated within each position
          (candidate votes ÷ total votes for that position). Turnout uses unique voters across the whole election.
        </Alert>
      )}

      {data.positions?.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>No positions configured for this election yet.</Alert>
      )}

      {data.positions?.map((pos) => (
        <Card key={pos._id || pos.title} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Typography variant="h6" component="h3">{pos.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${pos.totalVotes || 0} votes`} size="small" />
                {pos.seats > 1 && <Chip label={`${pos.seats} seats`} size="small" variant="outlined" />}
              </Box>
            </Box>
            {pos.candidates?.length > 0 ? (
              <>
                <VoteResultsChart
                  candidates={pos.candidates}
                  chartType={chartType}
                  positionTitle={pos.title}
                />
                <Box sx={{ mt: 2 }}>
                  {pos.candidates.map((c, i) => (
                    <Box
                      key={c.candidateId}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        bgcolor: i === 0 && c.voteCount > 0 ? 'action.selected' : 'transparent',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Avatar src={c.photoUrl || undefined} alt="" sx={{ width: 28, height: 28 }} />
                        <Typography fontWeight={i === 0 ? 600 : 400} noWrap>
                          {i + 1}. {c.displayName}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${c.voteCount} (${c.votePct ?? 0}%)`}
                        size="small"
                        color={i === 0 && c.voteCount > 0 ? 'secondary' : 'default'}
                      />
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No candidates on the ballot for this position yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
