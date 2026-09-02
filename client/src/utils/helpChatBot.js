export const WELCOME_MESSAGE =
  "Hi! I'm your VU Voting assistant. Ask me how to vote, find polls, or navigate the app.";

export const QUICK_SUGGESTIONS = [
  'How do I vote?',
  'What are polls?',
  'Where are results?',
  'Verify my receipt',
];

const FALLBACK = {
  text: 'I can help you navigate. Try asking about voting, polls, results, candidates, or type "tutorial" to restart the guided tour.',
  suggestions: QUICK_SUGGESTIONS,
};

function matchAny(text, words) {
  return words.some((w) => text.includes(w));
}

/**
 * Rule-based intent matching — returns structured bot reply (no API needed).
 * @param {string} message - User message
 * @param {{ isAdmin?: boolean, isLoggedIn?: boolean }} context
 */
export function getBotResponse(message, context = {}) {
  const { isAdmin = false, isLoggedIn = false } = context;
  const q = message.toLowerCase().trim();

  if (!q) return FALLBACK;

  if (matchAny(q, ['tutorial', 'tour', 'guided', 'onboarding', 'walkthrough'])) {
    return {
      text: 'I\'ll restart the guided tour for you. It walks through every major feature — tiles, voting, polls, results, and more. You can also tap Tutorial in the Help page anytime.',
      action: 'startTutorial',
      links: [{ label: 'Help & FAQ', path: '/help' }],
    };
  }

  if (matchAny(q, ['register', 'sign up', 'signup', 'create account', 'new account'])) {
    return {
      text: 'Register with your VU student email (s#######@live.vu.edu.au). You\'ll verify via OTP sent to your inbox, then set a password. Once verified you can vote and apply as a candidate.',
      links: [
        { label: 'Register', path: '/register' },
        { label: 'Sign in', path: '/login/student' },
      ],
    };
  }

  if (matchAny(q, ['login', 'log in', 'sign in', 'otp', 'password', 'forgot'])) {
    return {
      text: 'Sign in with your VU email and password. If you forgot your password, use the reset link on the login page. OTP verification is used during registration and for extra security checks.',
      links: [
        { label: 'Student login', path: '/login/student' },
        { label: 'Forgot password', path: '/forgot-password' },
      ],
    };
  }

  if (matchAny(q, ['vote', 'ballot', 'cast', 'voting', 'my ballot'])) {
  const voteLinks = isLoggedIn
    ? [
        { label: 'My Ballots', path: '/my-ballots' },
        { label: 'Browse elections', path: '/elections' },
      ]
    : [
        { label: 'Register to vote', path: '/register' },
        { label: 'Sign in', path: '/login/student' },
      ];
    return {
      text: 'To cast an official vote: open My Ballots → choose an election → review candidates with photos → confirm your choices → complete selfie verification if required → save your receipt token. One vote per position per election.',
      links: voteLinks,
    };
  }

  if (matchAny(q, ['poll', 'prediction', 'opinion', 'not official'])) {
    return {
      text: 'Public polls capture predictions and opinions — they are NOT official votes. Use them to share who you think will win. Official ballots are cast separately through My Ballots during the voting window.',
      links: [
        { label: 'Public polls', path: '/polls' },
        { label: 'My Ballots (official)', path: '/my-ballots' },
      ],
    };
  }

  if (matchAny(q, ['result', 'live', 'score', 'standings', 'winner', 'champion'])) {
    return {
      text: 'Live results show real-time vote counts, championship-style scoreboards, and interactive charts. Select an election to watch momentum bars update as ballots are cast.',
      links: [
        { label: 'Live results', path: '/live' },
        { label: 'Browse elections', path: '/elections' },
      ],
    };
  }

  if (matchAny(q, ['election', 'browse', 'search', 'filter', 'campus'])) {
    return {
      text: 'The Elections page lets you search by name, description, or candidate. Filter by voting status: open, upcoming, or finished. Each election hub shows candidates, discussion, and community insights.',
      links: [
        { label: 'Elections', path: '/elections' },
        { label: 'Election calendar', path: '/calendar' },
      ],
    };
  }

  if (matchAny(q, ['calendar', 'date', 'deadline', 'schedule', 'when'])) {
    return {
      text: 'The Election Calendar lists voting windows, application deadlines, and key dates across all campus elections.',
      links: [{ label: 'Election calendar', path: '/calendar' }],
    };
  }

  if (matchAny(q, ['candidate', 'apply', 'run', 'campaign', 'manifesto', 'profile'])) {
    return {
      text: 'Approved candidates appear on ballots with photos and manifestos. To run: apply before the deadline, then build your profile (bio, speech, goals). View candidate profiles from election pages or the Discussion tab.',
      links: [
        { label: 'Apply as candidate', path: '/apply' },
        { label: 'Elections', path: '/elections' },
      ],
    };
  }

  if (matchAny(q, ['discussion', 'comment', 'forum', 'chat', 'community'])) {
    return {
      text: 'Each election has a Discussion tab for public comments and debate. Community Insights analyse discussion and profiles to summarise why voters support each candidate — powered by on-platform data.',
      links: [
        { label: 'Elections', path: '/elections' },
        { label: 'Public polls', path: '/polls' },
      ],
    };
  }

  if (matchAny(q, ['insight', 'ai', 'analysis', 'support'])) {
    return {
      text: 'Community Insights summarise public discussion and candidate profiles to show trending themes and why voters back each candidate. Find them on election hub pages alongside live results.',
      links: [{ label: 'Elections', path: '/elections' }],
    };
  }

  if (matchAny(q, ['receipt', 'verify', 'proof', 'token', 'confirm vote'])) {
    return {
      text: 'After voting you receive a receipt token. Use Verify Receipt to confirm your ballot was recorded on the public ledger — enter your token on the verification page.',
      links: [{ label: 'Verify receipt', path: '/verify-receipt' }],
    };
  }

  if (matchAny(q, ['selfie', 'photo', 'identity', 'verification'])) {
    return {
      text: 'Some elections require selfie verification during voting to confirm your identity. You\'ll be prompted on the ballot page — allow camera access and follow the on-screen steps.',
      links: [{ label: 'My Ballots', path: '/my-ballots' }],
    };
  }

  if (matchAny(q, ['dashboard', 'home', 'tile', 'start'])) {
    return {
      text: 'Your dashboard shows open ballots and quick actions. The Home page has a tile grid linking to Vote, Elections, Polls, Results, Calendar, and more.',
      links: [
        { label: 'Home', path: '/' },
        ...(isLoggedIn ? [{ label: 'Dashboard', path: '/dashboard' }] : []),
      ],
    };
  }

  if (matchAny(q, ['notification', 'alert', 'bell', 'update'])) {
    return {
      text: 'Notifications alert you to election updates, poll replies, and account activity. Check the bell icon in your account menu when signed in.',
      links: isLoggedIn
        ? [{ label: 'Notifications', path: '/notifications' }]
        : [{ label: 'Sign in', path: '/login/student' }],
    };
  }

  if (matchAny(q, ['help', 'faq', 'support', 'contact'])) {
    return {
      text: 'The Help page covers registration, OTP login, voting rules, receipt verification, and results. You can also replay the guided tutorial from there.',
      links: [
        { label: 'Help & FAQ', path: '/help' },
        { label: 'About the system', path: '/about' },
      ],
    };
  }

  if (isAdmin && matchAny(q, ['admin', 'manage', 'audit', 'certify', 'publish'])) {
    return {
      text: 'Admins manage elections, review applications, certify results, and view audit logs. Use the admin dashboard tabs: Elections, Results, Applications, Audit, Polls, and more.',
      links: [
        { label: 'Admin dashboard', path: '/admin' },
        { label: 'Manage elections', path: '/admin?tab=elections' },
        { label: 'Audit logs', path: '/admin?tab=audit' },
      ],
    };
  }

  if (matchAny(q, ['team', 'developer', 'capstone', 'project'])) {
    return {
      text: 'This system was built by the NIT3003 Capstone development team. Meet the team profiles and project credits on the Team and About pages.',
      links: [
        { label: 'Development team', path: '/team' },
        { label: 'About', path: '/about' },
      ],
    };
  }

  if (matchAny(q, ['hello', 'hi', 'hey', 'help me'])) {
    return {
      text: WELCOME_MESSAGE,
      suggestions: QUICK_SUGGESTIONS,
    };
  }

  return FALLBACK;
}
