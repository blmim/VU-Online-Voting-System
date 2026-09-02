import { Box, Tab, Tabs, Tooltip } from '@mui/material';
import { VU_GOLD, VU_NAVY } from '../theme';

function TabLabel({ label, tooltip }) {
  if (!tooltip) return label;
  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="top"
      enterDelay={400}
      PopperProps={{ sx: { zIndex: 14000 } }}
    >
      <span>{label}</span>
    </Tooltip>
  );
}

/**
 * Security-themed tab bar — navy container, gold indicator, coordinated with AppBar.
 */
export default function SecureTabs({
  value,
  onChange,
  tabs,
  sx,
  'aria-label': ariaLabel = 'Section tabs',
  ...props
}) {
  return (
    <Box
      sx={{
        mb: 2,
        p: 0.5,
        borderRadius: 2.5,
        bgcolor: 'rgba(0, 51, 102, 0.06)',
        border: '1px solid rgba(0, 51, 102, 0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0, 51, 102, 0.06)',
        ...sx,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label={ariaLabel}
        TabIndicatorProps={{
          sx: {
            height: 3,
            borderRadius: '3px 3px 0 0',
            bgcolor: VU_GOLD,
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.45)',
          },
        }}
        sx={{
          minHeight: 44,
          '& .MuiTabs-flexContainer': { gap: 0.5 },
        }}
        {...props}
      >
        {tabs.map((t) => (
          <Tab
            key={t.value}
            value={t.value}
            label={<TabLabel label={t.label} tooltip={t.tooltip} />}
            icon={t.icon}
            iconPosition={t.icon ? 'start' : undefined}
            disabled={t.disabled}
            aria-label={t.tooltip || t.label}
            sx={{
              minHeight: 44,
              px: { xs: 1.5, sm: 2.5 },
              borderRadius: 2,
              fontWeight: value === t.value ? 700 : 500,
              color: value === t.value ? VU_NAVY : 'text.secondary',
              bgcolor: value === t.value ? 'rgba(255,255,255, 0.95)' : 'transparent',
              border: value === t.value ? '1px solid rgba(0, 51, 102, 0.1)' : '1px solid transparent',
              boxShadow: value === t.value ? '0 2px 8px rgba(0, 51, 102, 0.08)' : 'none',
              transition: 'all 0.22s ease',
              '&:hover': {
                bgcolor: value === t.value ? 'white' : 'rgba(255,255,255, 0.5)',
                color: VU_NAVY,
              },
              '&.Mui-selected': { color: VU_NAVY },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
