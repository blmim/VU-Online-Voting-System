import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

const POSITION_RULES = [
  {
    test: (title) => /^president$/i.test(title) || (/president/i.test(title) && !/vice|deputy/i.test(title)),
    Icon: EmojiEventsIcon,
    shortLabel: 'President',
  },
  {
    test: (title) => /vice[\s-]*president|^vp$/i.test(title),
    Icon: MilitaryTechIcon,
    shortLabel: 'VP',
  },
  {
    test: (title) => /secretary/i.test(title),
    Icon: AssignmentIcon,
    shortLabel: 'Secretary',
  },
  {
    test: (title) => /treasurer/i.test(title),
    Icon: AccountBalanceIcon,
    shortLabel: 'Treasurer',
  },
];

export function getPositionIconMeta(title) {
  const t = String(title || '').trim();
  const rule = POSITION_RULES.find((r) => r.test(t));
  if (rule) {
    return { Icon: rule.Icon, shortLabel: rule.shortLabel, tooltip: `Running for ${t || rule.shortLabel}` };
  }
  return {
    Icon: WorkOutlineIcon,
    shortLabel: t.length > 12 ? `${t.slice(0, 10)}…` : t,
    tooltip: t ? `Running for ${t}` : 'Candidate',
  };
}

export function positionSortKey(title) {
  const t = String(title || '').trim();
  const idx = POSITION_RULES.findIndex((r) => r.test(t));
  if (idx >= 0) return idx;
  return 10 + t.toLowerCase();
}

export function sortPositions(positions = []) {
  return [...new Set(positions.filter(Boolean))].sort(
    (a, b) => positionSortKey(a) - positionSortKey(b) || a.localeCompare(b),
  );
}
