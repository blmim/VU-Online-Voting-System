import { Box, Chip, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuth } from '../context/AuthContext';
import { VU_GOLD, VU_NAVY } from '../theme';

const TRUST_ITEMS = [
  { icon: LockIcon, label: 'TLS encrypted' },
  { icon: VerifiedUserIcon, label: 'OTP verified login' },
  { icon: ShieldIcon, label: 'Audit trail active' },
];

export default function SecurityTrustBar() {
  const { user } = useAuth();

  return (
    <Box
      role="status"
      aria-label="Platform security status"
      sx={{
        py: 0.6,
        px: 2,
        background: `linear-gradient(90deg, #002244 0%, ${VU_NAVY} 40%, #004080 100%)`,
        borderBottom: `1px solid rgba(212, 175, 55, 0.35)`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ maxWidth: 1200, mx: 'auto' }}
      >
        <LockIcon sx={{ fontSize: 14, color: VU_GOLD }} aria-hidden />
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          Secure voting platform
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: { xs: 'none', sm: 'inline' } }}>
          |
        </Typography>
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <Chip
            key={label}
            size="small"
            icon={<Icon sx={{ fontSize: '14px !important', color: `${VU_GOLD} !important` }} />}
            label={label}
            sx={{
              height: 22,
              bgcolor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              fontSize: '0.68rem',
              fontWeight: 500,
              '& .MuiChip-icon': { ml: 0.5 },
            }}
          />
        ))}
        {user && (
          <Chip
            size="small"
            label={`Signed in · ${user.role === 'admin' ? 'Administrator' : 'Verified voter'}`}
            sx={{
              height: 22,
              bgcolor: 'rgba(212, 175, 55, 0.15)',
              color: VU_GOLD,
              border: `1px solid rgba(212, 175, 55, 0.4)`,
              fontSize: '0.68rem',
              fontWeight: 600,
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
