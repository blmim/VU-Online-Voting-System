import { Box } from '@mui/material';

export default function VuLogo({
  height = 40,
  alt = 'Victoria University Sydney Australia logo',
  onDark = false,
  sx,
}) {
  const image = (
    <Box
      component="img"
      src="/vu-logo.png"
      alt={alt}
      sx={{
        height,
        width: 'auto',
        display: 'block',
        flexShrink: 0,
        ...(!onDark && {
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
        }),
      }}
    />
  );

  if (!onDark) {
    return (
      <Box sx={{ display: 'inline-flex', lineHeight: 0, ...sx }}>
        {image}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,0.98)',
        borderRadius: 2,
        px: 1,
        py: 0.5,
        lineHeight: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        ...sx,
      }}
    >
      {image}
    </Box>
  );
}
