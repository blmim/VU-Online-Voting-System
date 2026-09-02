import { Link } from 'react-router-dom';
import { Avatar, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { VU_GOLD, VU_NAVY } from '../theme';

function ArenaPortrait({ candidate, side, index }) {
  const id = candidate.candidateId || candidate._id;
  const animClass = side === 'left' ? 'vu-arena-float-left' : 'vu-arena-float-right';
  const delay = index * 0.35;

  return (
    <Box
      component={Link}
      to={`/candidates/${id}`}
      aria-label={`View profile for ${candidate.displayName}`}
      className={`vu-arena-portrait ${animClass}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'white',
        animationDelay: `${delay}s`,
        position: 'relative',
        '&:hover .vu-arena-avatar': {
          transform: 'scale(1.06)',
          boxShadow: `0 0 32px rgba(212, 175, 55, 0.75), 0 0 48px rgba(255, 107, 53, 0.35)`,
        },
      }}
    >
      <Box
        className="vu-arena-avatar vu-arena-glow"
        sx={{
          position: 'relative',
          width: { md: 120, lg: 140 },
          height: { md: 120, lg: 140 },
          borderRadius: '50%',
          p: 0.4,
          background: `linear-gradient(135deg, ${VU_GOLD}, #ff6b35, ${VU_GOLD})`,
          backgroundSize: '200% 200%',
          transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <Box className="vu-arena-scan" aria-hidden />
        <Avatar
          src={candidate.photoUrl || undefined}
          alt={candidate.displayName}
          sx={{
            width: '100%',
            height: '100%',
            border: `3px solid ${VU_NAVY}`,
            bgcolor: '#004080',
            fontSize: '2rem',
            fontWeight: 800,
          }}
        >
          {candidate.displayName?.charAt(0)}
        </Avatar>
        {index === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              bgcolor: VU_GOLD,
              color: VU_NAVY,
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 16 }} />
          </Box>
        )}
      </Box>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{
          mt: 1,
          textAlign: 'center',
          maxWidth: 110,
          lineHeight: 1.2,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {candidate.displayName}
      </Typography>
      {candidate.positions?.[0] && (
        <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.65rem' }}>
          {candidate.positions[0]}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Championship hero flanks — animated candidate portraits left & right of center content.
 */
export default function HeroArenaSpotlight({ candidates = [], children }) {
  const list = candidates.slice(0, 4);
  const left = list.filter((_, i) => i % 2 === 0);
  const right = list.filter((_, i) => i % 2 === 1);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(100px, 1fr) minmax(280px, 2fr) minmax(100px, 1fr)',
        },
        alignItems: 'center',
        gap: { xs: 0, md: 2 },
        minHeight: { md: 280 },
      }}
    >
      {/* Ambient spotlights */}
      <Box
        className="vu-arena-spotlight-left"
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          left: 0,
          top: '10%',
          bottom: '10%',
          width: '28%',
          background: 'radial-gradient(ellipse at left, rgba(212,175,55,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        className="vu-arena-spotlight-right"
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          right: 0,
          top: '10%',
          bottom: '10%',
          width: '28%',
          background: 'radial-gradient(ellipse at right, rgba(255,107,53,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left contenders */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          py: 2,
        }}
      >
        {left.map((c, i) => (
          <ArenaPortrait key={c.userId || c.candidateId || c._id} candidate={c} side="left" index={i} />
        ))}
      </Box>

      {/* Center hero content */}
      <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 1, md: 0 } }}>
        {children}
        {/* VS badge — desktop only when we have contenders */}
        {list.length >= 2 && (
          <Typography
            aria-hidden
            className="vu-arena-vs"
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '4rem',
              fontWeight: 900,
              color: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
              userSelect: 'none',
              letterSpacing: '-0.05em',
            }}
          >
            VS
          </Typography>
        )}
      </Box>

      {/* Right contenders */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          py: 2,
        }}
      >
        {right.map((c, i) => (
          <ArenaPortrait key={c.userId || c.candidateId || c._id} candidate={c} side="right" index={i} />
        ))}
      </Box>

      {/* Mobile: horizontal contender strip */}
      {list.length > 0 && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mt: 2,
            gridColumn: '1',
          }}
        >
          {list.slice(0, 3).map((c, i) => (
            <ArenaPortrait key={c.userId || c.candidateId || c._id} candidate={c} side={i % 2 === 0 ? 'left' : 'right'} index={i} />
          ))}
        </Box>
      )}
    </Box>
  );
}
