import { Box, Tooltip, Typography } from '@mui/material';
import { getPositionIconMeta, sortPositions } from '../utils/positionIcons';
import { VU_GOLD, VU_NAVY } from '../theme';

const MAX_VISIBLE = 3;

export default function CandidatePositionBadges({ positions = [], size = 'small' }) {
  const sorted = sortPositions(positions);
  if (!sorted.length) return null;

  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - visible.length;
  const iconSize = size === 'medium' ? 18 : 15;
  const boxSize = size === 'medium' ? 26 : 22;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      {visible.map((title) => {
        const { Icon, tooltip } = getPositionIconMeta(title);
        return (
          <Tooltip key={title} title={tooltip} arrow>
            <Box
              sx={{
                width: boxSize,
                height: boxSize,
                borderRadius: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,51,102,0.08)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Icon sx={{ fontSize: iconSize, color: VU_NAVY }} />
            </Box>
          </Tooltip>
        );
      })}
      {overflow > 0 && (
        <Tooltip title={sorted.slice(MAX_VISIBLE).map((p) => `Running for ${p}`).join(', ')} arrow>
          <Typography
            variant="caption"
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'rgba(255,193,7,0.2)',
              color: VU_NAVY,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            +{overflow}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
