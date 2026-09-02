import { useEffect, useRef, useState } from 'react';

import {

  Box, Container, Typography, Link, Divider, Grid, Chip, Avatar, Button, Switch, FormControlLabel,

} from '@mui/material';

import { Link as RouterLink } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';

import HowToVoteIcon from '@mui/icons-material/HowToVote';

import PollIcon from '@mui/icons-material/Poll';

import InfoIcon from '@mui/icons-material/Info';

import GroupsIcon from '@mui/icons-material/Groups';

import LiveTvIcon from '@mui/icons-material/LiveTv';

import EventIcon from '@mui/icons-material/Event';

import VerifiedIcon from '@mui/icons-material/Verified';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import LoginIcon from '@mui/icons-material/Login';

import PersonAddIcon from '@mui/icons-material/PersonAdd';

import GitHubIcon from '@mui/icons-material/GitHub';

import SecurityIcon from '@mui/icons-material/Security';

import SpeedIcon from '@mui/icons-material/Speed';

import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';

import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import FavoriteIcon from '@mui/icons-material/Favorite';

import { PROJECT, TEAM } from '../constants/team';

import { ROUTE_TOOLTIPS } from '../constants/routeTooltips';

import VuLogo from './VuLogo';

import ClickableTooltip from './ClickableTooltip';

import { useAccessibility } from '../context/AccessibilityContext';
import { useLiveRegion } from './LiveRegionAnnouncer';

import { VU_GOLD } from '../theme';



const FOOTER_LINKS = [

  { to: '/', label: 'Home', icon: HomeIcon },

  { to: '/elections', label: 'Elections', icon: HowToVoteIcon },

  { to: '/polls', label: 'Polls', icon: PollIcon },

  { to: '/live', label: 'Live Results', icon: LiveTvIcon },

  { to: '/about', label: 'About', icon: InfoIcon },

  { to: '/team', label: 'Team', icon: GroupsIcon },

  { to: '/calendar', label: 'Calendar', icon: EventIcon },

  { to: '/verify-receipt', label: 'Verify Receipt', icon: VerifiedIcon },

  { to: '/help', label: 'Help', icon: HelpOutlineIcon },

  { to: '/login', label: 'Login', icon: LoginIcon },

  { to: '/register', label: 'Register', icon: PersonAddIcon },

];



const NFR_CHIPS = [

  { label: 'Security', icon: SecurityIcon, desc: 'JWT, OTP, audit logs' },

  { label: 'Performance', icon: SpeedIcon, desc: 'Socket.IO + polling' },

  { label: 'Usability', icon: AccessibilityNewIcon, desc: 'WCAG, responsive UI' },

  { label: 'Reliability', icon: VerifiedUserIcon, desc: 'Transactions, vote integrity' },

];



function FooterLink({ item }) {

  const Icon = item.icon;

  return (

    <ClickableTooltip title={ROUTE_TOOLTIPS[item.to]} to={item.to} clickable={false}>

      <Link

        component={RouterLink}

        to={item.to}

        color="inherit"

        underline="none"

        aria-label={ROUTE_TOOLTIPS[item.to]}

        sx={{

          display: 'flex',

          alignItems: 'center',

          gap: 1,

          py: 0.5,

          opacity: 0.85,

          fontSize: '0.875rem',

          transition: 'opacity 0.2s ease, transform 0.2s ease, color 0.2s ease',

          '&:hover': {

            opacity: 1,

            color: VU_GOLD,

            transform: 'translateX(4px)',

          },

          '@media (prefers-reduced-motion: reduce)': {

            '&:hover': { transform: 'none' },

          },

        }}

      >

        <Icon sx={{ fontSize: 16, opacity: 0.7 }} aria-hidden />

        {item.label}

      </Link>

    </ClickableTooltip>

  );

}



export default function Footer() {

  const ref = useRef(null);

  const [visible, setVisible] = useState(false);

  const { enhanced, toggleEnhanced } = useAccessibility();
  const { announce } = useLiveRegion();

  const handleA11yToggle = () => {
    const next = !enhanced;
    toggleEnhanced();
    announce(
      next
        ? 'Enhanced accessibility enabled. Larger focus rings, underlined links, minimum 44 pixel touch targets, and reduced motion are now active.'
        : 'Enhanced accessibility disabled. Standard display settings restored.',
      'assertive',
    );
  };



  useEffect(() => {

    const el = ref.current;

    if (!el) return undefined;

    const observer = new IntersectionObserver(

      ([entry]) => { if (entry.isIntersecting) setVisible(true); },

      { threshold: 0.1 },

    );

    observer.observe(el);

    return () => observer.disconnect();

  }, []);



  return (

    <Box

      ref={ref}

      component="footer"

      role="contentinfo"

      className={visible ? 'vu-footer-visible' : ''}

      sx={{

        mt: 'auto',

        position: 'relative',

        background: 'linear-gradient(135deg, #002244 0%, #003366 50%, #001a33 100%)',

        backgroundSize: '200% 200%',

        animation: 'heroGradient 12s ease infinite',

        color: 'primary.contrastText',

        pb: { xs: 10, sm: 4 },

        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },

        '&::before': {

          content: '""',

          position: 'absolute',

          top: 0,

          left: 0,

          right: 0,

          height: 3,

          background: 'linear-gradient(90deg, transparent, #D4AF37, #E0C56A, #D4AF37, transparent)',

          backgroundSize: '200% 100%',

          animation: 'shimmer 3s linear infinite',

          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },

        },

      }}

    >

      <Container maxWidth="lg" sx={{ py: 5, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>

        <Grid container spacing={4}>

          {/* Brand */}

          <Grid item xs={12} md={3}>

            <ClickableTooltip title="Go to Home" to="/" clickable={false}>

              <Box

                component={RouterLink}

                to="/"

                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit', mb: 2 }}

                aria-label="Home — VU Online Voting System"

              >

                <VuLogo height={52} onDark animated />

                <Box>

                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>

                    {PROJECT.title}

                  </Typography>

                  <Typography variant="caption" sx={{ color: 'secondary.main', opacity: 0.9 }}>

                    {PROJECT.university}

                  </Typography>

                </Box>

              </Box>

            </ClickableTooltip>

            <Typography variant="body2" sx={{ opacity: 0.75, lineHeight: 1.7, mb: 2 }}>

              Secure campus elections for Victoria University Sydney.

            </Typography>

            {PROJECT.github && (

              <ClickableTooltip title="Open GitHub repository in a new tab" clickable={false}>

                <Button

                  component="a"

                  href={PROJECT.github}

                  target="_blank"

                  rel="noopener noreferrer"

                  variant="outlined"

                  size="small"

                  startIcon={<GitHubIcon />}

                  aria-label="View project on GitHub"

                  sx={{

                    borderColor: VU_GOLD,

                    color: VU_GOLD,

                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',

                    '&:hover': {

                      borderColor: VU_GOLD,

                      bgcolor: 'rgba(212,175,55,0.1)',

                      transform: 'translateY(-2px)',

                      boxShadow: '0 4px 12px rgba(212,175,55,0.25)',

                    },

                  }}

                >

                  GitHub

                </Button>

              </ClickableTooltip>

            )}

            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2, opacity: 0.7 }}>

              Built with <FavoriteIcon sx={{ fontSize: 12, color: 'error.light' }} aria-hidden /> by {PROJECT.group}

            </Typography>

          </Grid>



          {/* Quick Links */}

          <Grid item xs={12} sm={6} md={3} data-tour="footer-links">

            <Typography

              variant="overline"

              sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}

            >

              Quick Links

            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>

              {FOOTER_LINKS.map((item) => (

                <FooterLink key={item.to} item={item} />

              ))}

            </Box>

          </Grid>



          {/* NFR Evidence */}

          <Grid item xs={12} sm={6} md={3}>

            <Typography

              variant="overline"

              sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}

            >

              NFR Evidence

            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>

              {NFR_CHIPS.map((chip) => {

                const Icon = chip.icon;

                return (

                  <ClickableTooltip key={chip.label} title={`${chip.label}: ${chip.desc}`} to="/about" clickable={false}>

                    <Chip

                      component={RouterLink}

                      to="/about"

                      clickable

                      icon={<Icon sx={{ fontSize: '16px !important' }} />}

                      label={chip.label}

                      size="small"

                      aria-label={`${chip.label} — ${chip.desc}. View NFR evidence on About page`}

                      sx={{

                        bgcolor: 'rgba(255,255,255,0.08)',

                        color: 'white',

                        border: '1px solid rgba(212,175,55,0.3)',

                        transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',

                        '&:hover': {

                          bgcolor: 'rgba(212,175,55,0.15)',

                          borderColor: VU_GOLD,

                          boxShadow: '0 0 12px rgba(212,175,55,0.3)',

                          transform: 'scale(1.03)',

                        },

                        '@media (prefers-reduced-motion: reduce)': {

                          '&:hover': { transform: 'none' },

                        },

                      }}

                    />

                  </ClickableTooltip>

                );

              })}

            </Box>

          </Grid>



          {/* Team */}

          <Grid item xs={12} md={3}>

            <Typography

              variant="overline"

              sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.12em', display: 'block', mb: 1.5 }}

            >

              Team

            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>

              {TEAM.map((member) => (

                <ClickableTooltip

                  key={member.slug}

                  title={`View profile for ${member.name} — ${member.role}`}

                  to={`/team/${member.slug}`}

                  clickable={false}

                >

                  <Box

                    component={RouterLink}

                    to={`/team/${member.slug}`}

                    aria-label={`View profile for ${member.name}, ${member.role}`}

                    sx={{

                      display: 'flex',

                      flexDirection: 'column',

                      alignItems: 'center',

                      textAlign: 'center',

                      p: 1,

                      borderRadius: 2,

                      textDecoration: 'none',

                      color: 'inherit',

                      bgcolor: 'rgba(255,255,255,0.05)',

                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',

                      '&:hover': {

                        transform: 'scale(1.05)',

                        boxShadow: `0 0 0 2px ${VU_GOLD}`,

                      },

                      '@media (prefers-reduced-motion: reduce)': {

                        '&:hover': { transform: 'none' },

                      },

                    }}

                  >

                    <Avatar

                      src={member.photo}

                      alt={member.name}

                      sx={{ width: 44, height: 44, mb: 0.5, border: '2px solid rgba(212,175,55,0.4)' }}

                    >

                      {member.initials}

                    </Avatar>

                    <Typography variant="caption" fontWeight={600} lineHeight={1.2}>

                      {member.name.split(' ')[0]}

                    </Typography>

                    <Typography variant="caption" sx={{ opacity: 0.65, fontSize: '0.65rem' }}>

                      {member.role.split(' ')[0]}

                    </Typography>

                  </Box>

                </ClickableTooltip>

              ))}

            </Box>

          </Grid>

        </Grid>



        <Divider

          sx={{

            my: 3,

            border: 'none',

            height: 1,

            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',

          }}

        />



        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>

            © {PROJECT.year} {PROJECT.university} — {PROJECT.unit} · {PROJECT.group}

          </Typography>

          <FormControlLabel

            data-tour="a11y-toggle"

            control={

              <Switch

                checked={enhanced}

                onChange={handleA11yToggle}

                size="small"

                inputProps={{
                  'aria-label': 'Toggle enhanced accessibility mode — enables larger gold focus rings, underlined links, 44 pixel minimum buttons, and reduced animations',
                  'aria-describedby': 'a11y-toggle-description',
                }}

              />

            }

            label={

              <Typography id="a11y-toggle-description" variant="caption" sx={{ opacity: 0.8 }}>

                Enhanced accessibility — stronger focus rings, link underlines, and larger tap targets

              </Typography>

            }

            sx={{ m: 0 }}

          />

        </Box>

      </Container>

    </Box>

  );

}

