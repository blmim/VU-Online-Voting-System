import { useState, useEffect, useCallback } from 'react';

import {

  AppBar, Toolbar, Typography, Button, Box, Container, Dialog, DialogTitle,

  DialogContent, DialogContentText, DialogActions, IconButton, Tooltip, Drawer,

  List, ListItemButton, ListItemIcon, ListItemText, Divider,

} from '@mui/material';

import SchoolIcon from '@mui/icons-material/School';

import SearchIcon from '@mui/icons-material/Search';

import MenuIcon from '@mui/icons-material/Menu';

import CloseIcon from '@mui/icons-material/Close';

import HomeIcon from '@mui/icons-material/Home';

import HowToVoteIcon from '@mui/icons-material/HowToVote';

import PollIcon from '@mui/icons-material/Poll';

import LiveTvIcon from '@mui/icons-material/LiveTv';

import InfoIcon from '@mui/icons-material/Info';

import GroupsIcon from '@mui/icons-material/Groups';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import DashboardIcon from '@mui/icons-material/Dashboard';

import BallotIcon from '@mui/icons-material/Ballot';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { useTutorial } from '../context/TutorialContext';

import VuLogo from './VuLogo';

import Footer from './Footer';

import PageHeader from './PageHeader';

import UserMenu from './UserMenu';

import NotificationBell from './NotificationBell';

import ProductTour, { TutorialAutoStart } from './ProductTour';

import GlobalSearch, { useGlobalSearchShortcut } from './GlobalSearch';

import HelpChatAssistant from './HelpChatAssistant';

import ClickableTooltip from './ClickableTooltip';
import SecurityTrustBar from './SecurityTrustBar';

import { PROJECT } from '../constants/team';

import { getRouteTooltip } from '../constants/routeTooltips';

import { VU_GOLD } from '../theme';



const ICON_MAP = {

  Home: HomeIcon,

  Elections: HowToVoteIcon,

  Polls: PollIcon,

  Results: LiveTvIcon,

  About: InfoIcon,

  Team: GroupsIcon,

  Help: HelpOutlineIcon,

  Vote: HowToVoteIcon,

  Dashboard: DashboardIcon,

  'My Ballots': BallotIcon,

};



const GUEST_NAV = [

  { to: '/', label: 'Home', icon: HomeIcon, tour: 'nav-home' },

  { to: '/elections', label: 'Elections', icon: HowToVoteIcon, tour: 'nav-elections' },

  { to: '/polls', label: 'Polls', icon: PollIcon, tour: 'nav-polls' },

  { to: '/live', label: 'Results', icon: LiveTvIcon, tour: 'nav-results', 'aria-label': 'Public election results' },

  { to: '/about', label: 'About', icon: InfoIcon, hideSm: true, tour: 'nav-about' },

  { to: '/team', label: 'Team', icon: GroupsIcon, hideSm: true, tour: 'nav-team' },

  { to: '/help', label: 'Help', icon: HelpOutlineIcon, tour: 'nav-help' },

];



const STUDENT_NAV = [

  { to: '/my-ballots', label: 'Vote', icon: HowToVoteIcon, highlight: true, tour: 'nav-vote' },

  { to: '/elections', label: 'Elections', icon: HowToVoteIcon, tour: 'nav-elections' },

  { to: '/polls', label: 'Polls', icon: PollIcon, tour: 'nav-polls' },

  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, highlight: true, tour: 'nav-dashboard' },

  { to: '/live', label: 'Results', icon: LiveTvIcon, tour: 'nav-results', 'aria-label': 'Public election results' },

  { to: '/help', label: 'Help', icon: HelpOutlineIcon, tour: 'nav-help' },

];



const ADMIN_NAV = [

  { to: '/admin', label: 'Dashboard', icon: DashboardIcon },

  { to: '/admin?tab=elections', label: 'Elections', icon: HowToVoteIcon },

  { to: '/admin?tab=applications', label: 'Candidates', icon: GroupsIcon },

  { to: '/admin?tab=results', label: 'Results', icon: LiveTvIcon },

  { to: '/admin?tab=audit', label: 'Audit', icon: AdminPanelSettingsIcon, hideSm: true },

  { to: '/help', label: 'Help', icon: HelpOutlineIcon },

];



function isNavActive(pathname, to) {

  const base = to.split('?')[0];

  if (base === '/') return pathname === '/';

  if (to.includes('?')) return pathname === base || (pathname === '/admin' && window.location.search.includes(to.split('?')[1]));

  return pathname === base || pathname.startsWith(`${base}/`);

}



function NavPill({ item, pathname, onClick }) {

  const Icon = item.icon || ICON_MAP[item.label] || HomeIcon;

  const active = isNavActive(pathname, item.to);



  return (

    <ClickableTooltip title={getRouteTooltip(item.to)} to={item.to} clickable={false}>

      <Button

        component={Link}

        to={item.to}

        onClick={onClick}

        color="inherit"

        size="small"

        aria-label={item['aria-label'] || `Go to ${item.label}`}

        aria-current={active ? 'page' : undefined}

        data-tour={item.tour}

        startIcon={<Icon sx={{ fontSize: '1rem !important' }} />}

        sx={{

          display: item.hideSm ? { xs: 'none', lg: 'inline-flex' } : { xs: 'none', md: 'inline-flex' },

          mx: 0.25,

          px: 1.25,

          py: 0.75,

          minWidth: 0,

          borderRadius: 2,

          fontWeight: active || item.highlight ? 700 : 500,

          color: item.highlight && !active ? 'secondary.main' : 'inherit',

          bgcolor: active ? 'rgba(212,175,55,0.18)' : 'transparent',
          boxShadow: active ? 'inset 0 0 0 1px rgba(212,175,55,0.35)' : 'none',

          position: 'relative',

          transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',

          '&::after': {

            content: '""',

            position: 'absolute',

            bottom: 2,

            left: '15%',

            width: '70%',

            height: 2,

            bgcolor: VU_GOLD,

            borderRadius: 1,

            transform: active ? 'scaleX(1)' : 'scaleX(0)',

            transformOrigin: 'center',

            transition: 'transform 0.25s ease',

          },

          '&:hover': {

            bgcolor: 'rgba(255,255,255,0.1)',

            '&::after': { transform: 'scaleX(1)' },

          },

          '@media (prefers-reduced-motion: reduce)': {

            transition: 'background-color 0.2s ease',

          },

        }}

      >

        {item.label}

      </Button>

    </ClickableTooltip>

  );

}



export default function Layout({ children }) {

  const { user, logout } = useAuth();

  const { startTour } = useTutorial();

  const navigate = useNavigate();

  const location = useLocation();

  const openSearch = useCallback(() => setSearchOpen(true), []);

  const handleStartTour = useCallback(() => {
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => startTour(), 200);
    } else {
      startTour();
    }
  }, [location.pathname, navigate, startTour]);

  const [logoutOpen, setLogoutOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);



  useGlobalSearchShortcut(openSearch);



  useEffect(() => {

    const onScroll = () => setScrolled(window.scrollY > 8);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);

  }, []);



  const confirmLogout = async () => {

    setLogoutOpen(false);

    await logout();

    navigate('/login');

  };



  const navLinks = !user ? GUEST_NAV : user.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;



  return (

    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <Box

        component="a"

        href="#main-content"

        data-tour="skip-to-content"

        sx={{

          position: 'absolute', left: -9999, top: 8, zIndex: 2000,

          bgcolor: 'secondary.main', color: 'primary.main', px: 2, py: 1,

          borderRadius: 1, fontWeight: 700, textDecoration: 'none',

          '&:focus': { left: 8 },

        }}

      >

        Skip to main content

      </Box>



      <AppBar

        position="sticky"

        role="banner"

        elevation={scrolled ? 4 : 2}

        sx={{

          backdropFilter: scrolled ? 'blur(12px)' : 'none',

          backgroundColor: scrolled ? 'rgba(0, 51, 102, 0.92)' : undefined,

          transition: 'box-shadow 0.3s ease, backdrop-filter 0.3s ease',

          '&::after': {

            content: '""',

            position: 'absolute',

            bottom: 0,

            left: 0,

            right: 0,

            height: 2,

            background: 'linear-gradient(90deg, transparent, #D4AF37, #E0C56A, #D4AF37, transparent)',

            backgroundSize: '200% 100%',

            animation: 'shimmer 4s linear infinite',

            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },

          },

        }}

      >

        <Toolbar sx={{ gap: 0.5, py: 0.75, flexWrap: 'nowrap', minHeight: { xs: 56, sm: 64 } }}>

          <ClickableTooltip title="Go to Home" to="/" clickable={false}>

            <Box

              component={Link}

              to="/"

              sx={{

                display: 'flex',

                alignItems: 'center',

                gap: 1.25,

                textDecoration: 'none',

                color: 'inherit',

                mr: { xs: 0.5, md: 1 },

                flexShrink: 0,

              }}

              aria-label="Home — VU Online Voting System"

            >

              <VuLogo height={38} onDark animated />

              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>

                <Typography variant="subtitle1" component="span" sx={{ lineHeight: 1.2, fontWeight: 700, fontSize: '0.95rem' }}>

                  {PROJECT.title}

                </Typography>

                <Typography variant="caption" component="div" sx={{ color: 'secondary.main', lineHeight: 1.2, opacity: 0.9 }}>

                  {PROJECT.university}

                </Typography>

              </Box>

            </Box>

          </ClickableTooltip>



          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flex: 1, justifyContent: 'center', flexWrap: 'wrap', gap: 0.25 }}>

            {navLinks.map((item) => (

              <NavPill key={item.to + item.label} item={item} pathname={location.pathname} />

            ))}

          </Box>



          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />



          <ClickableTooltip title="Search everything — Ctrl+K" clickable={false}>

            <IconButton

              color="inherit"

              onClick={() => setSearchOpen(true)}

              aria-label="Open global search"

              data-tour="global-search"

              sx={{ display: 'inline-flex' }}

            >

              <SearchIcon />

            </IconButton>

          </ClickableTooltip>



          <ClickableTooltip title="Start interactive tutorial" clickable={false}>

            <Button

              color="inherit"

              size="small"

              startIcon={<SchoolIcon />}

              onClick={handleStartTour}

              aria-label="Start tutorial"

              data-tour="tutorial-replay"

              sx={{

                display: { xs: 'none', lg: 'inline-flex' },

                border: '1.5px solid',

                borderColor: 'secondary.main',

                color: 'secondary.main',

                borderRadius: 2,

                px: 1.5,

                transition: 'transform 0.2s ease, box-shadow 0.2s ease',

                '&:hover': {

                  bgcolor: 'rgba(212,175,55,0.12)',

                  transform: 'translateY(-1px)',

                  boxShadow: '0 4px 12px rgba(212,175,55,0.25)',

                },

              }}

            >

              Tutorial

            </Button>

          </ClickableTooltip>



          <NotificationBell />



          {user ? (

            <UserMenu user={user} onLogout={() => setLogoutOpen(true)} />

          ) : (

            <>

              <ClickableTooltip title={getRouteTooltip('/login')} to="/login" clickable={false}>

                <Button

                  color="inherit"

                  component={Link}

                  to="/login"

                  size="small"

                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 600 }}

                >

                  Login

                </Button>

              </ClickableTooltip>

              <ClickableTooltip title={getRouteTooltip('/register')} to="/register" clickable={false}>

                <Button

                  component={Link}

                  to="/register"

                  variant="contained"

                  color="secondary"

                  size="small"

                  aria-label="Register to vote"

                  sx={{

                    ml: 0.5,

                    display: { xs: 'none', sm: 'inline-flex' },

                    fontWeight: 700,

                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',

                    '&:hover': {

                      transform: 'translateY(-2px)',

                      boxShadow: '0 6px 16px rgba(212,175,55,0.4)',

                    },

                  }}

                >

                  Register

                </Button>

              </ClickableTooltip>

            </>

          )}



          <IconButton

            color="inherit"

            aria-label="Open navigation menu"

            onClick={() => setMobileOpen(true)}

            sx={{ display: { xs: 'inline-flex', md: 'none' } }}

          >

            <MenuIcon />

          </IconButton>

        </Toolbar>

      </AppBar>

      <SecurityTrustBar />



      <Drawer

        anchor="right"

        open={mobileOpen}

        onClose={() => setMobileOpen(false)}

        PaperProps={{

          sx: {

            width: 280,

            background: 'linear-gradient(180deg, #002244 0%, #003366 100%)',

            color: 'white',

          },

        }}

      >

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>

          <Typography variant="subtitle1" fontWeight={700}>Menu</Typography>

          <IconButton color="inherit" onClick={() => setMobileOpen(false)} aria-label="Close menu">

            <CloseIcon />

          </IconButton>

        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

        <List role="navigation" aria-label="Mobile navigation">

          {navLinks.map((item) => {

            const Icon = item.icon;

            const active = isNavActive(location.pathname, item.to);

            return (

              <ListItemButton

                key={item.to + item.label}

                component={Link}

                to={item.to}

                onClick={() => setMobileOpen(false)}

                selected={active}

                aria-current={active ? 'page' : undefined}

                data-tour={item.tour}

                sx={{

                  '&.Mui-selected': { bgcolor: 'rgba(212,175,55,0.2)', borderLeft: `3px solid ${VU_GOLD}` },

                }}

              >

                <ListItemIcon sx={{ color: active ? 'secondary.main' : 'inherit', minWidth: 40 }}>

                  <Icon />

                </ListItemIcon>

                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />

              </ListItemButton>

            );

          })}

        </List>

        {!user && (

          <>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 1 }} />

            <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>

              <Button component={Link} to="/login" variant="outlined" color="inherit" fullWidth onClick={() => setMobileOpen(false)}>

                Login

              </Button>

              <Button component={Link} to="/register" variant="contained" color="secondary" fullWidth onClick={() => setMobileOpen(false)}>

                Register

              </Button>

            </Box>

          </>

        )}

      </Drawer>



      <Container component="main" id="main-content" role="main" tabIndex={-1} sx={{ flex: 1, py: { xs: 3, md: 4 }, outline: 'none' }} maxWidth="lg">

        <PageHeader />

        <Box key={location.pathname} className="vu-route-fade">

          {children}

        </Box>

      </Container>

      <Footer />



      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <HelpChatAssistant />

      <ProductTour />

      <TutorialAutoStart />



      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} aria-labelledby="logout-dialog-title">

        <DialogTitle id="logout-dialog-title">Sign out?</DialogTitle>

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

