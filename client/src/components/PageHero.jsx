import { Box, Typography } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function PageHero({ title, subtitle, children, compact }) {
  return (
    <Box
      component="section"
      aria-labelledby="page-hero-title"
      sx={{
        mb: 4,
        p: compact ? { xs: 2.5, md: 3 } : { xs: 2.5, md: 4 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 55%, #002244 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,51,102,0.22)',
        borderBottom: `3px solid ${VU_GOLD}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, transparent 30%, rgba(212,175,55,0.08) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'heroGradient 10s ease infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        },
      }}
      className="vu-hero-animated vu-page-enter"
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography id="page-hero-title" variant="h4" component="h1" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ opacity: 0.9, maxWidth: 720, mb: children ? 2 : 0, lineHeight: 1.7 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}
