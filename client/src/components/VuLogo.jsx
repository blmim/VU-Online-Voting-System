import { Box } from '@mui/material';
import { VU_GOLD, VU_GOLD_LIGHT, VU_NAVY } from '../theme';

function DiamondEyeSvg({ size, onDark, animated }) {
  const gold = onDark ? '#FFFFFF' : VU_GOLD;
  const goldLight = onDark ? VU_GOLD_LIGHT : VU_GOLD_LIGHT;
  const navy = VU_NAVY;
  const eyeWhite = onDark ? 'rgba(255,255,255,0.95)' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={animated ? 'vu-logo-eye' : undefined}
    >
      {/* Outer diamond */}
      <rect
        x="32" y="6"
        width="36" height="36"
        rx="2"
        transform="rotate(45 32 32)"
        fill={gold}
        stroke={onDark ? goldLight : gold}
        strokeWidth="1.5"
      />
      {/* Inner diamond depth */}
      <rect
        x="32" y="14"
        width="24" height="24"
        rx="1"
        transform="rotate(45 32 32)"
        fill={onDark ? 'rgba(0,51,102,0.35)' : 'rgba(0,51,102,0.12)'}
      />
      {/* Eye almond */}
      <ellipse cx="32" cy="32" rx="14" ry="8" fill={eyeWhite} opacity="0.95" />
      {/* Upper eyelid accent */}
      <path
        d="M18 30 Q32 24 46 30"
        stroke={gold}
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      {/* Pupil */}
      <circle
        cx="32" cy="32" r="5.5"
        fill={navy}
        className={animated ? 'vu-logo-pupil' : undefined}
      />
      {/* Vote checkmark in pupil */}
      <path
        d="M29 32 L31.5 34.5 L36 29"
        stroke={gold}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Corner sparkle */}
      <circle cx="48" cy="16" r="1.5" fill={goldLight} opacity="0.7" />
    </svg>
  );
}

export default function VuLogo({
  height = 40,
  alt = 'VU Online Voting System — diamond eye logo',
  onDark = false,
  animated = true,
  sx,
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        flexShrink: 0,
        transition: 'transform 0.25s ease',
        '&:hover': animated ? { transform: 'scale(1.06)' } : {},
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
        ...sx,
      }}
      role="img"
      aria-label={alt}
      className={animated ? 'vu-logo-eye' : undefined}
    >
      <DiamondEyeSvg size={height} onDark={onDark} animated={animated} />
    </Box>
  );
}
