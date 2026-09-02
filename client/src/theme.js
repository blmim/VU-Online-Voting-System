import { createTheme } from '@mui/material/styles';

const VU_NAVY = '#003366';
const VU_GOLD = '#D4AF37';
const VU_GOLD_LIGHT = '#C5A572';
const VU_LIGHT = '#F5F7FA';

const PREMIUM_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
    fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 12 },
  transitions: {
    easing: {
      easeInOut: PREMIUM_EASE,
      easeOut: PREMIUM_EASE,
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: PREMIUM_EASE,
    },
    duration: {
      shortest: 180,
      shorter: 220,
      short: 280,
      standard: 350,
      complex: 450,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'linear-gradient(180deg, #F5F7FA 0%, #EEF2F7 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          transition: `transform 0.3s ${PREMIUM_EASE}, box-shadow 0.3s ${PREMIUM_EASE}, background-color 0.25s ease`,
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          boxShadow: '0 4px 14px rgba(0,51,102,0.28)',
          '&:hover': {
            backgroundColor: '#004080',
            boxShadow: '0 8px 24px rgba(0,51,102,0.35)',
          },
        },
        containedSecondary: {
          boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(212,175,55,0.45)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
            boxShadow: '0 4px 12px rgba(0,51,102,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,51,102,0.07)',
          border: '1px solid rgba(0, 51, 102, 0.06)',
          transition: `transform 0.35s ${PREMIUM_EASE}, box-shadow 0.35s ${PREMIUM_EASE}`,
          '&:hover': {
            boxShadow: '0 12px 32px rgba(0,51,102,0.11)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0,51,102,0.07)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: `box-shadow 0.3s ${PREMIUM_EASE}, border-color 0.25s ease`,
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.2)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0, 34, 68, 0.22)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, #002244 0%, ${VU_NAVY} 35%, #004080 70%, ${VU_NAVY} 100%)`,
          borderBottom: 'none',
          boxShadow: '0 4px 24px rgba(0, 34, 68, 0.35)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            backgroundColor: VU_GOLD,
            height: 3,
            borderRadius: '3px 3px 0 0',
            transition: `all 0.35s ${PREMIUM_EASE}`,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 44,
          transition: `background-color 0.3s ${PREMIUM_EASE}, color 0.3s ${PREMIUM_EASE}, box-shadow 0.3s ${PREMIUM_EASE}`,
          '&:hover': {
            backgroundColor: 'rgba(0, 51, 102, 0.06)',
            color: VU_NAVY,
          },
          '&.Mui-selected': {
            color: VU_NAVY,
            fontWeight: 700,
          },
          '&:focus-visible': {
            outline: `2px solid ${VU_GOLD}`,
            outlineOffset: 2,
          },
        },
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
        root: {
          cursor: 'pointer',
          transition: `color 0.25s ${PREMIUM_EASE}, opacity 0.25s ease`,
          '&:hover': { opacity: 0.88 },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:not(.Mui-disabled)': { cursor: 'pointer' },
          '&:focus-visible': {
            outline: `2px solid ${VU_GOLD}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
          transition: `background-color 0.3s ${PREMIUM_EASE}, transform 0.35s ${PREMIUM_EASE}, box-shadow 0.35s ${PREMIUM_EASE}`,
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 24px rgba(0,51,102,0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        clickable: {
          cursor: 'pointer',
          transition: `box-shadow 0.3s ${PREMIUM_EASE}, transform 0.3s ${PREMIUM_EASE}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,51,102,0.12)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          transition: `transform 0.35s ${PREMIUM_EASE}, box-shadow 0.35s ${PREMIUM_EASE}`,
          '&:hover': {
            transform: 'scale(1.06)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `background-color 0.25s ease, transform 0.3s ${PREMIUM_EASE}`,
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
});

export { VU_NAVY, VU_GOLD, VU_GOLD_LIGHT, PREMIUM_EASE };
export default theme;
