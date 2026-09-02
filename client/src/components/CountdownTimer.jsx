import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { VU_GOLD } from '../theme';

function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function getTimeLeft(endDate) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function Unit({ value, label }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        minWidth: 56,
        px: 1,
        py: 0.75,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <Typography variant="h5" fontWeight={800} sx={{ color: VU_GOLD, lineHeight: 1.1 }}>
        {pad(value)}
      </Typography>
      <Typography variant="caption" sx={{ opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function CountdownTimer({ endDate, label = 'Voting closes in' }) {
  const [left, setLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(endDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!endDate) return null;
  if (!left) {
    return (
      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
        Voting period has ended
      </Typography>
    );
  }

  return (
    <Box aria-live="polite" aria-label={`${label}: ${left.days} days, ${left.hours} hours`}>
      <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1 }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Unit value={left.days} label="Days" />
        <Unit value={left.hours} label="Hours" />
        <Unit value={left.minutes} label="Min" />
        <Unit value={left.seconds} label="Sec" />
      </Box>
    </Box>
  );
}
