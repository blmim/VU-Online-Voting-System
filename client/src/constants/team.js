export const PROJECT = {
  title: 'Online Voting System',
  fullName: 'Online Voting System for Campus Elections',
  projectNumber: 'Project 11',
  unit: 'NIT3003 IT Capstone Project 1',
  university: 'Victoria University Sydney',
  year: '2026',
  group: 'Group 6',
  github: 'https://github.com/blmim/VU-Online-Voting-System',
};

export const TEAM = [
  {
    slug: 'adil',
    name: 'Adil Ahnaf',
    id: 's8114083',
    role: 'Backend & Security',
    focus: 'Backend API, vote casting, audit logging',
    initials: 'AA',
    photo: '/team/adil.jpeg',
    contributions: [
      'Designed and implemented REST API endpoints for elections and voting',
      'Built secure vote-casting logic with duplicate-vote prevention',
      'Implemented comprehensive audit logging for election integrity',
      'Integrated authentication middleware and role-based access control',
    ],
  },
  {
    slug: 'amith',
    name: 'Amith Hassan',
    id: 's8072671',
    role: 'Frontend & UX',
    focus: 'Frontend UI/UX, accessibility, public live results',
    initials: 'AH',
    photo: '/team/amith.jpeg',
    contributions: [
      'Designed responsive user interfaces with Material UI components',
      'Ensured WCAG-aligned accessibility across the voting website',
      'Built the public live results dashboard with real-time updates',
      'Polished user flows for registration, login, and ballot casting',
    ],
  },
  {
    slug: 'ranjana',
    name: 'Ranjana Nepal',
    id: 's8116502',
    role: 'Database & Testing',
    focus: 'Database design, eligibility rules, testing',
    initials: 'RN',
    photo: '/team/ranjana.jpeg',
    contributions: [
      'Designed MongoDB schemas for users, elections, votes, and audit logs',
      'Implemented voter eligibility rules and validation logic',
      'Authored test plans and executed functional testing across modules',
      'Documented data models and election lifecycle workflows',
    ],
  },
  {
    slug: 'samir',
    name: 'Mr Samir Sapkota',
    id: 's8139428',
    role: 'Project Lead & Admin',
    focus: 'Admin dashboard, SMTP integration, deployment',
    initials: 'SS',
    photo: '/team/samir.webp',
    contributions: [
      'Led project coordination and capstone deliverable planning',
      'Built the administrator dashboard for election management',
      'Integrated SMTP email for OTP verification and notifications',
      'Managed deployment configuration and environment setup',
    ],
  },
];

export function getMemberEmail(studentId) {
  return `${studentId}@live.vu.edu.au`;
}

export function getTeamMember(slug) {
  return TEAM.find((member) => member.slug === slug);
}

export function getTeamMemberByStudentId(studentId) {
  const normalized = String(studentId || '').toLowerCase();
  return TEAM.find((member) => member.id.toLowerCase() === normalized);
}
