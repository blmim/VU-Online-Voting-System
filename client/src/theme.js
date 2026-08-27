import { createTheme } from '@mui/material/styles';

const VU_NAVY = '#003366';
const VU_GOLD = '#D4AF37';
const VU_GOLD_LIGHT = '#C5A572';
const VU_LIGHT = '#F5F7FA';

const theme = createTheme({
  palette: {
    primary: {
      main: VU_NAVY,
      light: '#004080',
      dark: '#002244',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: VU_GOLD,
      light: '#E0C56A',
      dark: '#B8941F',
      contrastText: VU_NAVY,
    },
    success: { main: '#2E7D32' },
    error: { main: '#C62828' },
    background: { default: VU_LIGHT, paper: '#FFFFFF' },
    text: { primary: '#1A1A2E', secondary: '#4A5568' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(0,51,102,0.25)',
          '&:hover': {
            backgroundColor: '#004080',
            boxShadow: '0 4px 12px rgba(0,51,102,0.35)',
          },
        },
        containedSecondary: {
          boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 2px 16px rgba(0,51,102,0.08)',
          transition: 'box-shadow 0.25s ease',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(90deg, ${VU_NAVY} 0%, #004080 85%, ${VU_NAVY} 100%)`,
          borderBottom: `3px solid ${VU_GOLD}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': { fontWeight: 600 },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: { transition: 'color 0.2s ease' },
      },
    },
  },
});

export { VU_NAVY, VU_GOLD, VU_GOLD_LIGHT };
export default theme;
