import { useState } from 'react';

import {
  AppBar, Toolbar, Typography, Button, Box, Container, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import VuLogo from './VuLogo';
import Footer from './Footer';
import PageHeader from './PageHeader';
import UserMenu from './UserMenu';
import { PROJECT } from '../constants/team';

const navButtonSx = { display: { xs: 'none', sm: 'inline-flex' } };
const navButtonMobileSx = { display: 'inline-flex' };

function NavButton({ to, children, sx, ...props }) {
  return (
    <Button color="inherit" component={Link} to={to} sx={{ ...navButtonSx, ...sx }} {...props}>
      {children}
    </Button>
  );
}

const GUEST_NAV = [
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Team' },
  { to: '/live', label: 'Live Results', 'aria-label': 'Public live results' },
  { to: '/help', label: 'Help' },
];

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-ballots', label: 'My Ballots', sx: { fontWeight: 600 } },
  { to: '/apply', label: 'Apply Candidate' },
  { to: '/live', label: 'Live Results', 'aria-label': 'Public live results' },
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Team', sx: navButtonMobileSx },
  { to: '/help', label: 'Help' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin?tab=elections', label: 'Elections' },
  { to: '/admin?tab=applications', label: 'Candidates' },
  { to: '/admin?tab=results', label: 'Results' },
  { to: '/admin?tab=admins', label: 'Admins' },
  { to: '/admin?tab=audit', label: 'Audit Logs' },
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Team', sx: navButtonMobileSx },
  { to: '/help', label: 'Help' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinks = !user
    ? GUEST_NAV
    : user.role === 'admin'
      ? ADMIN_NAV
      : STUDENT_NAV;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 8,
          zIndex: 2000,
          bgcolor: 'secondary.main',
          color: 'primary.main',
          px: 2,
          py: 1,
          borderRadius: 1,
          fontWeight: 700,
          textDecoration: 'none',
          '&:focus': { left: 8 },
        }}
      >
        Skip to main content
      </Box>
      <AppBar position="static" role="banner" elevation={2}>
        <Toolbar sx={{ gap: 1, py: 0.5, flexWrap: 'wrap' }}>
          <Box
            component={Link}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit', mr: 1 }}
            aria-label="Home"
          >
            <VuLogo height={44} onDark />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" component="span" sx={{ lineHeight: 1.2, fontWeight: 600 }}>
                {PROJECT.title}
              </Typography>
              <Typography variant="caption" component="div" sx={{ color: 'secondary.main', lineHeight: 1.2 }}>
                {PROJECT.university}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {navLinks.map((item) => (
            <NavButton key={item.to + item.label} to={item.to} sx={item.sx} aria-label={item['aria-label']}>
              {item.label}
            </NavButton>
          ))}

          {user ? (
            <UserMenu user={user} onLogout={() => setLogoutOpen(true)} />
          ) : (
            <>
              <NavButton to="/login">Login</NavButton>
              <Button
                color="inherit"
                component={Link}
                to="/register"
                variant="outlined"
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  ml: 0.5,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" id="main-content" tabIndex={-1} sx={{ flex: 1, py: 4, outline: 'none' }} maxWidth="lg">
        <PageHeader />
        {children}
      </Container>
      <Footer />

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <DialogTitle>Sign out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will need to sign in again to access your dashboard and vote.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutOpen(false)}>Cancel</Button>
          <Button onClick={confirmLogout} variant="contained" autoFocus>Logout</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
