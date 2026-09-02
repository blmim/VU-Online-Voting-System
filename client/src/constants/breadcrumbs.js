import HomeIcon from '@mui/icons-material/Home';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PollIcon from '@mui/icons-material/Poll';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import InfoIcon from '@mui/icons-material/Info';
import GroupsIcon from '@mui/icons-material/Groups';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BallotIcon from '@mui/icons-material/Ballot';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventIcon from '@mui/icons-material/Event';
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import CampaignIcon from '@mui/icons-material/Campaign';
import { getTeamMember } from './team';

export const ROUTE_META = {
  '/': { label: 'Home', icon: HomeIcon },
  '/elections': { label: 'Elections', icon: HowToVoteIcon },
  '/polls': { label: 'Polls', icon: PollIcon },
  '/live': { label: 'Live Results', icon: LiveTvIcon },
  '/about': { label: 'About', icon: InfoIcon },
  '/team': { label: 'Team', icon: GroupsIcon },
  '/help': { label: 'Help', icon: HelpOutlineIcon },
  '/login': { label: 'Login', icon: LoginIcon },
  '/login/student': { label: 'Student Login', icon: LoginIcon },
  '/login/admin': { label: 'Admin Login', icon: AdminPanelSettingsIcon },
  '/register': { label: 'Register', icon: PersonAddIcon },
  '/forgot-password': { label: 'Forgot Password', icon: LockResetIcon },
  '/reset-password': { label: 'Reset Password', icon: LockResetIcon },
  '/profile': { label: 'My Profile', icon: PersonIcon },
  '/notifications': { label: 'Notifications', icon: NotificationsIcon },
  '/dashboard': { label: 'Dashboard', icon: DashboardIcon },
  '/my-ballots': { label: 'My Ballots', icon: BallotIcon },
  '/apply': { label: 'Apply as Candidate', icon: CampaignIcon },
  '/calendar': { label: 'Election Calendar', icon: EventIcon },
  '/verify-receipt': { label: 'Verify Receipt', icon: VerifiedIcon },
  '/admin': { label: 'Admin Dashboard', icon: AdminPanelSettingsIcon },
  '/my-candidate-profile': { label: 'My Candidate Profile', icon: CampaignIcon },
};

function metaForPath(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith('/team/')) {
    const slug = pathname.split('/')[2];
    const member = getTeamMember(slug);
    return { label: member?.name || 'Team Member', icon: PersonIcon };
  }
  if (pathname.startsWith('/vote/')) return { label: 'Cast Your Vote', icon: HowToVoteIcon };
  if (pathname.startsWith('/polls/')) return { label: 'Poll Detail', icon: PollIcon };
  if (pathname.startsWith('/live/')) return { label: 'Live Results', icon: LiveTvIcon };
  if (pathname.startsWith('/elections/')) return { label: 'Election Hub', icon: HowToVoteIcon };
  if (pathname.startsWith('/candidates/')) return { label: 'Candidate Profile', icon: PersonIcon };
  return { label: 'Page', icon: InfoIcon };
}

export function getBreadcrumbTrail(pathname) {
  const home = { to: '/', label: 'Home', icon: HomeIcon, tooltip: 'Go to Home' };

  if (pathname === '/') return [home];

  const segments = pathname.split('/').filter(Boolean);
  const trail = [home];

  if (segments[0] === 'team' && segments[1]) {
    trail.push({ to: '/team', label: 'Team', icon: GroupsIcon, tooltip: 'Go to Team' });
    const member = getTeamMember(segments[1]);
    trail.push({
      label: member?.name || 'Team Member',
      icon: PersonIcon,
      tooltip: member ? `Profile: ${member.name}` : undefined,
    });
    return trail;
  }

  if (segments[0] === 'vote' && segments[1]) {
    trail.push({ to: '/my-ballots', label: 'My Ballots', icon: BallotIcon, tooltip: 'Go to My Ballots' });
    trail.push({ label: 'Cast Your Vote', icon: HowToVoteIcon });
    return trail;
  }

  if (segments[0] === 'polls' && segments[1]) {
    trail.push({ to: '/polls', label: 'Polls', icon: PollIcon, tooltip: 'Go to Polls' });
    trail.push({ label: 'Poll Detail', icon: PollIcon });
    return trail;
  }

  if (segments[0] === 'live' && segments[1]) {
    trail.push({ to: '/live', label: 'Live Results', icon: LiveTvIcon, tooltip: 'Go to Live Results' });
    trail.push({ label: 'Election Results', icon: LiveTvIcon });
    return trail;
  }

  if (segments[0] === 'elections' && segments[1]) {
    trail.push({ to: '/elections', label: 'Elections', icon: HowToVoteIcon, tooltip: 'Go to Elections' });
    trail.push({ label: 'Election Hub', icon: HowToVoteIcon });
    return trail;
  }

  if (segments[0] === 'candidates' && segments[1]) {
    trail.push({ to: '/elections', label: 'Elections', icon: HowToVoteIcon, tooltip: 'Go to Elections' });
    trail.push({ label: 'Candidate Profile', icon: PersonIcon });
    return trail;
  }

  if (pathname === '/login/student' || pathname === '/login/admin') {
    trail.push({ to: '/login', label: 'Login', icon: LoginIcon, tooltip: 'Go to Login' });
    const meta = metaForPath(pathname);
    trail.push({ label: meta.label, icon: meta.icon });
    return trail;
  }

  const meta = metaForPath(pathname);
  trail.push({ label: meta.label, icon: meta.icon });
  return trail;
}

export function getPageTitle(pathname) {
  const trail = getBreadcrumbTrail(pathname);
  return trail[trail.length - 1]?.label || 'Page';
}
