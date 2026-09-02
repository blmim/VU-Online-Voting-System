import { Typography, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Breadcrumbs from './Breadcrumbs';
import { getPageTitle } from '../constants/breadcrumbs';
import { useBreadcrumbOverride } from '../context/BreadcrumbContext';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function PageHeader() {
  const { pathname } = useLocation();
  const { override } = useBreadcrumbOverride();
  const title = override?.length
    ? override[override.length - 1]?.label
    : getPageTitle(pathname);
  const isHome = pathname === '/';

  if (isHome) return null;

  return (
    <Box
      component="header"
      className="vu-breadcrumb-fade"
      sx={{
        mb: 3,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        background: `linear-gradient(135deg, rgba(0, 51, 102, 0.04) 0%, rgba(255,255,255,0.95) 50%, rgba(0, 64, 128, 0.03) 100%)`,
        border: '1px solid rgba(0, 51, 102, 0.1)',
        borderLeft: `4px solid ${VU_GOLD}`,
        boxShadow: '0 2px 12px rgba(0, 51, 102, 0.06)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Breadcrumbs />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <ShieldOutlinedIcon sx={{ color: VU_GOLD, fontSize: 28 }} aria-hidden />
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{
            letterSpacing: '-0.01em',
            background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', opacity: 0.85 }}>
        Protected area — your session is verified and activity may be logged for audit.
      </Typography>
    </Box>
  );
}
