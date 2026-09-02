import { useEffect, useState } from 'react';
import {
  Box, Chip, Skeleton, Typography,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BallotIcon from '@mui/icons-material/Ballot';
import PollIcon from '@mui/icons-material/Poll';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import CampaignIcon from '@mui/icons-material/Campaign';
import VerifiedIcon from '@mui/icons-material/Verified';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VuLogo from '../components/VuLogo';
import MetroTile from '../components/MetroTile';
import CountdownTimer from '../components/CountdownTimer';
import { useTutorial } from '../context/TutorialContext';
import { useAuth } from '../context/AuthContext';
import { PROJECT, TEAM } from '../constants/team';
import api from '../services/api';
import FeaturedCandidateChip from '../components/FeaturedCandidateChip';
import HeroArenaSpotlight from '../components/HeroArenaSpotlight';
import { VU_GOLD, VU_NAVY } from '../theme';

export default function Home() {
  const { user } = useAuth();
  const { startTour } = useTutorial();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/elections/home/public')
      .then((r) => setHome(r.data))
      .catch(() => setHome(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = home?.stats || {};
  const featured = home?.featuredElection;
  const featuredId = featured?._id;

  const tiles = [
    {
      title: 'Vote',
      subtitle: 'Cast your official ballot',
      icon: <HowToVoteIcon fontSize="inherit" />,
      to: '/my-ballots',
      color: '#8B0000',
      badge: stats.activeCount ? `${stats.activeCount} open` : null,
      auth: true,
      size: 'large',
      delay: 0,
      tour: 'tile-vote',
    },
    {
      title: 'Elections',
      subtitle: 'Browse & search',
      icon: <BallotIcon fontSize="inherit" />,
      to: '/elections',
      color: VU_NAVY,
      badge: stats.activeCount ? `${stats.activeCount} active` : null,
      delay: 80,
      tour: 'tile-elections',
    },
    {
      title: 'Live Results',
      subtitle: 'Championship scoreboard',
      icon: <LiveTvIcon fontSize="inherit" />,
      to: featuredId ? `/live/${featuredId}` : '/live',
      color: '#1a1a2e',
      badge: 'LIVE',
      delay: 160,
      tour: 'tile-live-results',
    },
    {
      title: 'Polls',
      subtitle: 'Public predictions',
      icon: <PollIcon fontSize="inherit" />,
      to: '/polls',
      color: '#2E7D32',
      badge: stats.activePolls ? `${stats.activePolls} active` : null,
      delay: 240,
      tour: 'tile-polls',
    },
    {
      title: 'Candidates',
      subtitle: 'Profiles & speeches',
      icon: <GroupsIcon fontSize="inherit" />,
      to: featuredId ? `/elections/${featuredId}?tab=candidates` : '/elections',
      color: '#004080',
      delay: 320,
    },
    {
      title: 'Discussion',
      subtitle: 'Community forum',
      icon: <ChatIcon fontSize="inherit" />,
      to: featuredId ? `/elections/${featuredId}?tab=discussion` : '/elections',
      color: '#5C6BC0',
      delay: 400,
    },
    {
      title: 'Insights',
      subtitle: 'AI community analysis',
      icon: <AutoAwesomeIcon fontSize="inherit" />,
      to: featuredId ? `/elections/${featuredId}?tab=insights` : '/elections',
      color: '#6A1B9A',
      size: 'wide',
      delay: 480,
    },
    {
      title: 'Calendar',
      subtitle: 'Election timeline',
      icon: <EventIcon fontSize="inherit" />,
      to: '/calendar',
      color: '#00838F',
      delay: 560,
    },
    {
      title: 'Apply',
      subtitle: 'Run for office',
      icon: <CampaignIcon fontSize="inherit" />,
      to: '/apply',
      color: '#EF6C00',
      auth: true,
      delay: 640,
    },
    {
      title: 'Verify Receipt',
      subtitle: 'Confirm your vote',
      icon: <VerifiedIcon fontSize="inherit" />,
      to: '/verify-receipt',
      color: '#455A64',
      delay: 720,
      tour: 'tile-verify',
    },
    {
      title: 'Help',
      subtitle: 'FAQ & support',
      icon: <HelpOutlineIcon fontSize="inherit" />,
      to: '/help',
      color: '#37474F',
      delay: 800,
    },
    {
      title: 'Tutorial',
      subtitle: 'Replay product tour',
      icon: <SchoolIcon fontSize="inherit" />,
      onClick: startTour,
      color: VU_NAVY,
      accent: VU_GOLD,
      delay: 880,
      tour: 'tutorial-replay',
    },
  ];

  const visibleTiles = tiles.filter((t) => !t.auth || user);

  const arenaCandidates = home?.featuredCandidates?.length
    ? home.featuredCandidates
    : TEAM.map((m) => ({
      displayName: m.name,
      photoUrl: m.photo,
      candidateId: m.slug,
      positions: [m.role],
    }));

  return (
    <Box sx={{ mx: -1 }}>
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 3, md: 4 },
          mb: 3,
          px: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${VU_NAVY} 0%, #004080 50%, #002244 100%)`,
          color: 'white',
          borderBottom: `4px solid ${VU_GOLD}`,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="vu-hero-animated"
        data-tour="home-hero"
      >
        <HeroArenaSpotlight candidates={arenaCandidates}>
          <VuLogo height={56} onDark sx={{ mb: 1, mx: 'auto' }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {PROJECT.title}
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 2 }}>
            {PROJECT.university} — Your championship election experience starts here
          </Typography>
          {featured && (
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Chip label="Trending" sx={{ bgcolor: '#ff6b35', color: 'white', fontWeight: 800, letterSpacing: 1 }} />
              <Chip label={featured.title} sx={{ bgcolor: VU_GOLD, color: VU_NAVY, fontWeight: 700 }} />
              <CountdownTimer endDate={featured.endTime} label="Voting closes in" />
            </Box>
          )}
        </HeroArenaSpotlight>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={140} className="vu-shimmer" />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            gridAutoFlow: 'dense',
          }}
          data-tour="tile-grid"
        >
          {visibleTiles.map((tile) => {
            const { tour, auth, ...tileProps } = tile;
            return (
              <MetroTile
                key={tile.title}
                data-tour={tour}
                {...tileProps}
              />
            );
          })}
        </Box>
      )}

      {!loading && home?.featuredCandidates?.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
            Featured candidates
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {home.featuredCandidates.map((c) => (
              <FeaturedCandidateChip
                key={c.userId || c.candidateId || c._id}
                candidate={c}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
