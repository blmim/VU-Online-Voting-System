import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Avatar, Box, Chip, LinearProgress, Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { VU_GOLD, VU_NAVY } from '../theme';

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + (i * 7)}%`,
    delay: `${i * 0.1}s`,
    color: i % 2 === 0 ? VU_GOLD : '#fff',
  })), []);

  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            top: 0,
            left: p.left,
            width: 6,
            height: 6,
            bgcolor: p.color,
            animation: `confettiFall 1.5s ease ${p.delay} infinite`,
            '@media (prefers-reduced-motion: reduce)': { display: 'none' },
          }}
        />
      ))}
    </Box>
  );
}

function FighterBar({ fighter, maxVotes, isLeader, isChampion }) {
  const pct = maxVotes > 0 ? Math.round((fighter.voteCount / maxVotes) * 100) : 0;
  const profilePath = fighter.candidateId ? `/candidates/${fighter.candidateId}` : null;

  const inner = (
    <Box
      className={isLeader ? 'vu-champion-pulse' : undefined}
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        bgcolor: isLeader ? 'rgba(212,175,55,0.12)' : 'rgba(0,51,102,0.06)',
        border: isLeader ? `2px solid ${VU_GOLD}` : '1px solid',
        borderColor: isLeader ? VU_GOLD : 'divider',
        position: 'relative',
        cursor: profilePath ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': profilePath ? { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,51,102,0.15)' } : {},
      }}
    >
      {isChampion && <Confetti />}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Avatar
          src={fighter.photoUrl || undefined}
          alt=""
          sx={{
            width: 64,
            height: 64,
            border: `3px solid ${isLeader ? VU_GOLD : VU_NAVY}`,
            bgcolor: VU_NAVY,
          }}
        >
          {fighter.displayName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} noWrap color="primary">
            {fighter.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fighter.voteCount} votes · {fighter.votePct ?? pct}%
          </Typography>
        </Box>
        {isLeader && fighter.voteCount > 0 && (
          <Chip
            icon={<EmojiEventsIcon className="vu-crown-bounce" />}
            label={isChampion ? 'CHAMPION' : 'LEADING'}
            sx={{
              bgcolor: VU_GOLD,
              color: VU_NAVY,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          />
        )}
      </Box>
      <Box sx={{ position: 'relative', height: 16, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
        <Box
          className="vu-bar-fill"
          sx={{
            height: '100%',
            width: `${pct}%`,
            background: isLeader
              ? `linear-gradient(90deg, ${VU_GOLD}, #E0C56A)`
              : `linear-gradient(90deg, ${VU_NAVY}, #004080)`,
            borderRadius: 2,
            transition: 'width 0.8s ease',
          }}
        />
      </Box>
    </Box>
  );

  if (profilePath) {
    return (
      <Box
        component={Link}
        to={profilePath}
        title={`View profile — ${fighter.displayName}`}
        sx={{ flex: 1, textDecoration: 'none', color: 'inherit', display: 'flex' }}
      >
        {inner}
      </Box>
    );
  }

  return inner;
}

export default function ChampionshipScoreboard({
  fighters = [],
  title = 'Championship Matchup',
  subtitle,
  marginThreshold = 5,
}) {
  const sorted = [...fighters].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const top = sorted[0];
  const second = sorted[1];
  const maxVotes = Math.max(...sorted.map((f) => f.voteCount || 0), 1);
  const isChampion = top && second
    && top.voteCount > 0
    && (top.voteCount - second.voteCount) >= marginThreshold;

  if (!sorted.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        No fighters on the card yet — votes will appear here live.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${VU_NAVY} 0%, #001a33 50%, ${VU_NAVY} 100%)`,
        color: 'white',
        border: `3px solid ${VU_GOLD}`,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="overline" sx={{ color: VU_GOLD, letterSpacing: 3, fontWeight: 700 }}>
          LIVE MATCH
        </Typography>
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {sorted.slice(0, 2).map((fighter, i) => (
          <FighterBar
            key={fighter.candidateId || fighter.displayName || i}
            fighter={fighter}
            maxVotes={maxVotes}
            isLeader={i === 0 && fighter.voteCount > 0}
            isChampion={i === 0 && isChampion}
          />
        ))}
      </Box>

      {sorted.length > 2 && (
        <Box sx={{ mt: 2 }}>
          {sorted.slice(2).map((fighter) => (
            <Box key={fighter.candidateId || fighter.displayName} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{fighter.displayName}</Typography>
                <Typography variant="caption">{fighter.voteCount} votes</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={maxVotes ? (fighter.voteCount / maxVotes) * 100 : 0}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,255,255,0.5)' } }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
