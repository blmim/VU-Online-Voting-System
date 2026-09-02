import { useMemo } from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Box, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getBreadcrumbTrail } from '../constants/breadcrumbs';
import { getRouteTooltip } from '../constants/routeTooltips';
import { useBreadcrumbOverride } from '../context/BreadcrumbContext';
import ClickableTooltip from './ClickableTooltip';
import { VU_GOLD } from '../theme';

function CrumbSegment({ item, isLast }) {
  const Icon = item.icon;
  const tooltip = item.tooltip || (item.to ? getRouteTooltip(item.to) || `Go to ${item.label}` : undefined);

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        py: 0.25,
        px: isLast ? 0 : 0.5,
        borderRadius: 1,
        position: 'relative',
        ...(isLast
          ? { color: VU_GOLD, fontWeight: 700 }
          : {
              color: 'text.secondary',
              transition: 'color 0.2s ease, transform 0.2s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '10%',
                width: '80%',
                height: 2,
                bgcolor: VU_GOLD,
                transform: 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.25s ease',
              },
              '&:hover': {
                color: 'primary.main',
                transform: 'translateX(3px)',
                '&::after': { transform: 'scaleX(1)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                '&:hover': { transform: 'none' },
              },
            }),
      }}
    >
      {Icon && <Icon sx={{ fontSize: 16, opacity: isLast ? 1 : 0.75 }} aria-hidden />}
      <Typography component="span" variant="body2" fontWeight={isLast ? 700 : 500}>
        {item.label}
      </Typography>
    </Box>
  );

  if (isLast || !item.to) {
    return (
      <Typography
        key={item.label}
        component="span"
        aria-current="page"
        sx={{ display: 'inline-flex' }}
      >
        {content}
      </Typography>
    );
  }

  return (
    <ClickableTooltip key={item.label} title={tooltip} clickable={false}>
      <Link
        component={RouterLink}
        to={item.to}
        underline="none"
        color="inherit"
        aria-label={tooltip || `Go to ${item.label}`}
      >
        {content}
      </Link>
    </ClickableTooltip>
  );
}

export default function Breadcrumbs({ items: itemsProp }) {
  const { pathname } = useLocation();
  const { override } = useBreadcrumbOverride();
  const items = useMemo(
    () => itemsProp || override || getBreadcrumbTrail(pathname),
    [itemsProp, override, pathname],
  );

  if (!items.length || (items.length === 1 && pathname === '/')) return null;

  return (
    <Box
      component="nav"
      aria-label="Breadcrumb navigation"
      className="vu-breadcrumb-fade"
      sx={{ mb: 1.5 }}
    >
      <MuiBreadcrumbs
        separator={
          <ChevronRightIcon
            sx={{ fontSize: 18, color: VU_GOLD, opacity: 0.85 }}
            aria-hidden
          />
        }
      >
        {items.map((item, i) => (
          <CrumbSegment key={`${item.to || ''}-${item.label}`} item={item} isLast={i === items.length - 1} />
        ))}
      </MuiBreadcrumbs>
    </Box>
  );
}
