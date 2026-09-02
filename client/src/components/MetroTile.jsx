import { Link as RouterLink } from 'react-router-dom';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function MetroTile({
  title,
  subtitle,
  tooltip,
  icon,
  to,
  onClick,
  color = VU_NAVY,
  accent = VU_GOLD,
  badge,
  size = 'medium',
  delay = 0,
  ...props
}) {
  const isLarge = size === 'large';
  const isWide = size === 'wide';
  const tooltipText = tooltip || (subtitle ? `${title} — ${subtitle}` : title);

  const sx = {
    animationDelay: `${delay}ms`,
    gridColumn: isWide ? 'span 2' : undefined,
    gridRow: isLarge ? 'span 2' : undefined,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    minHeight: isLarge ? 200 : isWide ? 120 : 140,
    p: 2.5,
    borderRadius: 2,
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'white',
    background: `linear-gradient(145deg, ${color} 0%, ${color}cc 100%)`,
    border: `1px solid ${accent}44`,
    overflow: 'hidden',
    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': {
      transform: 'scale(1.02) translateY(-4px)',
      boxShadow: `0 16px 40px ${color}45, 0 0 0 2px ${accent}`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
      opacity: 0,
      transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      pointerEvents: 'none',
    },
    '&:hover::after': {
      opacity: 1,
    },
    '&:focus-visible': {
      outline: `3px solid ${accent}`,
      outlineOffset: 2,
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'box-shadow 0.2s ease',
      '&:hover': { transform: 'none' },
    },
  };

  const content = (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: `${accent}22`,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          opacity: 0.9,
          fontSize: isLarge ? 48 : 36,
          pointerEvents: 'none',
        }}
      >
        {icon}
      </Box>
      {badge && (
        <Chip
          label={badge}
          size="small"
          component="span"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: accent,
            color: VU_NAVY,
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1, mt: isLarge ? 6 : 4 }}>
        <Typography variant={isLarge ? 'h5' : 'h6'} fontWeight={800} lineHeight={1.2}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </>
  );

  let tile;
  if (to) {
    tile = (
      <Box
        component={RouterLink}
        to={to}
        className="vu-tile-animate vu-premium-card"
        sx={sx}
        aria-label={badge ? `${title} — ${subtitle}. ${badge}` : `${title} — ${subtitle}`}
        {...props}
      >
        {content}
      </Box>
    );
  } else {
    tile = (
      <Box
        component={onClick ? 'button' : 'div'}
        type={onClick ? 'button' : undefined}
        className="vu-tile-animate vu-premium-card"
        sx={{
          ...sx,
          border: `1px solid ${accent}44`,
          font: 'inherit',
          textAlign: 'left',
          width: '100%',
        }}
        onClick={onClick}
        aria-label={subtitle ? `${title} — ${subtitle}` : title}
        {...props}
      >
        {content}
      </Box>
    );
  }

  if (!tooltipText) return tile;

  return (
    <Tooltip
      title={tooltipText}
      arrow
      placement="top"
      enterDelay={350}
      enterNextDelay={150}
      PopperProps={{ sx: { zIndex: 14000 } }}
    >
      {tile}
    </Tooltip>
  );
}
