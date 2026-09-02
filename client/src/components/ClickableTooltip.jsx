import { forwardRef } from 'react';
import { Box, Tooltip } from '@mui/material';
import { getRouteTooltip } from '../constants/routeTooltips';

const TooltipWrapper = forwardRef(function TooltipWrapper({
  sx, children, ...rest
}, ref) {
  return (
    <Box ref={ref} component="span" sx={sx} {...rest}>
      {children}
    </Box>
  );
});

/**
 * Wraps interactive elements with a hover tooltip and click affordance.
 * @param {string} [title] - Tooltip text (overrides `to` auto-text)
 * @param {string} [to] - Route path for auto-generated "Go to …" tooltip
 * @param {boolean} [disabled] - Suppress tooltip and hover styles
 * @param {boolean} [fullWidth] - Stretch wrapper for full-width buttons/cards
 * @param {boolean} [clickable=true] - Apply pointer cursor and hover lift
 */
export default function ClickableTooltip({
  title,
  to,
  children,
  disabled = false,
  disableTooltip = false,
  fullWidth = false,
  clickable = true,
  placement = 'top',
  arrow = true,
  ...tooltipProps
}) {
  const resolvedTitle = title || getRouteTooltip(to);

  const wrapperSx = {
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'inherit',
    verticalAlign: 'inherit',
    width: fullWidth ? '100%' : undefined,
    maxWidth: '100%',
    borderRadius: 'inherit',
    ...(clickable && !disabled
      ? {
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            filter: 'brightness(1.04)',
          },
        }
      : {}),
  };

  const wrapped = (
    <TooltipWrapper sx={wrapperSx}>
      {children}
    </TooltipWrapper>
  );

  if (!resolvedTitle || disabled || disableTooltip) {
    return wrapped;
  }

  return (
    <Tooltip
      title={resolvedTitle}
      arrow={arrow}
      placement={placement}
      enterDelay={400}
      enterNextDelay={200}
      PopperProps={{ sx: { zIndex: 14000 } }}
      {...tooltipProps}
    >
      {wrapped}
    </Tooltip>
  );
}
