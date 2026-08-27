import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Home',
  '/register': 'Register',
  '/login': 'Login',
  '/login/student': 'Student Login',
  '/login/admin': 'Administrator Login',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/profile': 'My Profile',
  '/notifications': 'Notifications',
  '/help': 'Help & FAQ',
  '/about': 'About',
  '/team': 'Development Team',
  '/dashboard': 'Dashboard',
  '/my-ballots': 'My Ballots',
  '/apply': 'Apply as Candidate',
  '/live': 'Live Results',
  '/admin': 'Admin Dashboard',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/team/')) return 'Team Member';
  if (pathname.startsWith('/vote/')) return 'Cast Your Vote';
  if (pathname.startsWith('/live/')) return 'Live Results';
  return 'Page';
}

export default function PageHeader() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const isHome = pathname === '/';

  if (isHome) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 0.5 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" component="h1" color="primary" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
}
