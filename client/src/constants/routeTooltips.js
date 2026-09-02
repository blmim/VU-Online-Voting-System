/** Short tooltip copy for navigation links — "Go to [Page] — [description]" */
export const ROUTE_TOOLTIPS = {
  '/': 'Go to Home — overview, stats, and quick links',
  '/elections': 'Go to Elections — browse and search campus elections',
  '/polls': 'Go to Polls — public prediction polls (not official votes)',
  '/live': 'Go to Results — live election results and standings',
  '/about': 'Go to About — how the system works and NFR evidence',
  '/team': 'Go to Team — meet the development team',
  '/help': 'Go to Help — FAQ and voting guidance',
  '/my-ballots': 'Go to Vote — view and cast your official ballots',
  '/dashboard': 'Go to Dashboard — your voter hub and open elections',
  '/login': 'Sign in to vote, apply, or manage your account',
  '/login/student': 'Sign in as a student voter',
  '/login/admin': 'Sign in as an election administrator',
  '/register': 'Create a VU voter account with email verification',
  '/apply': 'Apply to run as a candidate in an election',
  '/calendar': 'View the election calendar and key dates',
  '/verify-receipt': 'Verify your vote receipt on the public ledger',
  '/profile': 'View and edit your voter profile',
  '/notifications': 'View election alerts and account notifications',
  '/admin': 'Admin dashboard — manage elections and voters',
  '/admin?tab=elections': 'Manage elections — create, publish, and configure',
  '/admin?tab=applications': 'Review candidate applications',
  '/admin?tab=candidates': 'Review candidate applications',
  '/admin?tab=results': 'View and certify election results',
  '/admin?tab=admins': 'Manage administrator accounts',
  '/admin?tab=audit': 'Browse security and audit logs',
  '/admin?tab=search': 'Search users, candidates, and elections',
  '/admin?tab=anomalies': 'Review flagged voting anomalies',
  '/admin?tab=announcements': 'Publish homepage announcements',
  '/admin?tab=polls': 'Manage public prediction polls',
  '/admin?tab=testing': 'Testing tools for demo data',
};

export function getRouteTooltip(to) {
  if (!to) return '';
  return ROUTE_TOOLTIPS[to] || ROUTE_TOOLTIPS[to.split('?')[0]] || '';
}

export const QUICK_LINK_TOOLTIPS = {
  '/my-ballots': 'Open My Ballots — cast your official vote',
  '/elections': 'Open Elections — browse campus elections',
  '/polls': 'Open Polls — public prediction polls (not official votes)',
  '/live': 'Open Live Results — real-time vote counts',
  '/apply': 'Apply to run as a candidate',
  '/calendar': 'Open Election Calendar — key dates and deadlines',
  '/verify-receipt': 'Verify a vote receipt on the public ledger',
};

export const ADMIN_TAB_TOOLTIPS = [
  'Elections — create, publish, and manage elections',
  'Results — view live counts and certify winners',
  'Search — find users, candidates, and elections',
  'Admins — promote and manage administrators',
  'Applications — review candidate applications',
  'Anomalies — investigate flagged voting activity',
  'Audit Logs — security and action history',
  'Announcements — publish homepage notices',
  'Polls — manage public prediction polls',
  'Testing Tools — generate demo voters and data',
];

export const ELECTION_TAB_TOOLTIPS = {
  all: 'Show all published elections',
  active: 'Show elections with voting open now',
  upcoming: 'Show elections that have not started yet',
  finished: 'Show completed elections and final results',
};
