import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import {
  Box, Button, Chip, LinearProgress, Typography,
} from '@mui/material';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '../context/TutorialContext';
import { useLiveRegion } from './LiveRegionAnnouncer';
import { VU_GOLD, VU_NAVY } from '../theme';

const VIEWPORT_PAD = 24;

const FLOATER_OPTIONS = {
  preventOverflow: {
    boundariesElement: 'viewport',
    padding: VIEWPORT_PAD,
  },
  flip: {
    enabled: true,
    behavior: ['top', 'top-start', 'top-end', 'left', 'right', 'bottom'],
  },
};

const TOUR_STEP_DEFS = [
  {
    target: '[data-tour="home-hero"]',
    title: 'Welcome to VU Online Voting',
    summary: 'Your official, secure campus election portal.',
    content: 'Register with your VU email, verify with a one-time password, cast your ballot, and confirm it with a receipt token. Everything here is designed for transparency and auditability.',
    accessibility: 'Page changes are announced automatically for screen readers.',
    keyboard: 'Press Tab to move through the page. Shift+Tab goes backwards.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="skip-to-content"]',
    title: 'Skip to Main Content',
    summary: 'Jump past the header on any page.',
    content: 'Press Tab once after loading a page to reach this link. It moves focus straight to the main content area.',
    accessibility: 'Visually hidden until focused, then appears top-left with a gold background.',
    keyboard: 'Tab once, then Enter to activate.',
    placement: 'bottom',
    focusTarget: true,
  },
  {
    target: '[data-tour="tile-grid"]',
    title: 'Home Dashboard',
    summary: 'Shortcuts to every major feature.',
    content: 'Each coloured tile opens a section — Vote, Elections, Live Results, Polls, Calendar, and more. Hover any tile to see a description tooltip. Badges show live counts like open elections.',
    accessibility: 'Tiles are links with descriptive labels for screen readers.',
    keyboard: 'Tab between tiles, then Enter or Space to open.',
    placement: 'top',
  },
  {
    target: '[data-tour="tile-elections"]',
    title: 'Browse Elections',
    summary: 'Search, filter, and open any campus election.',
    content: 'View elections that are open, upcoming, or finished. Search by name or switch to the Candidates tab. Each election opens a hub with standings, profiles, and discussion.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tile-vote"]',
    title: 'Cast Your Vote',
    summary: 'Sign in required — submit official ballots here.',
    content: 'After logging in, open this tile to see open ballots. Select candidates, review your choices, and submit. You receive a receipt token to verify your vote later.',
    accessibility: 'Only visible when signed in as a student voter.',
    placement: 'right',
  },
  {
    target: '[data-tour="main-nav"]',
    title: 'Top Navigation',
    summary: 'Reach any section from every page.',
    content: 'The nav bar stays fixed at the top. Hover a link to see where it goes. The current page is highlighted in gold.',
    accessibility: 'Active page links use aria-current for screen readers.',
    keyboard: 'Tab through links, Enter to navigate.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="global-search"]',
    title: 'Global Search',
    summary: 'Find elections, candidates, polls, and pages.',
    content: 'Click the magnifying glass or press Ctrl+K (Cmd+K on Mac). Results are grouped by type and recent searches are saved.',
    keyboard: 'Ctrl+K opens search. Arrow keys move through results. Enter selects. Escape closes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="help-chat"]',
    title: 'Help Chat',
    summary: 'AI answers about voting and registration.',
    content: 'Tap the chat button in the bottom-right corner to ask about OTP login, casting votes, verifying receipts, or running as a candidate.',
    placement: 'top-start',
    offset: 16,
  },
  {
    target: '[data-tour="tile-verify"]',
    title: 'Verify Your Receipt',
    summary: 'Confirm your ballot was recorded.',
    content: 'After voting, paste your receipt token here to verify it was counted — without revealing who you voted for.',
    placement: 'top',
  },
  {
    target: '[data-tour="a11y-toggle"]',
    title: 'Accessibility Mode',
    summary: 'Stronger focus rings and larger tap targets.',
    content: 'Toggle this switch in the footer for gold focus outlines, underlined links, 44px minimum buttons, and reduced motion.',
    placement: 'top',
  },
  {
    target: '[data-tour="footer-links"]',
    title: 'Footer Links',
    summary: 'Calendar, Help, Team, and compliance badges.',
    content: 'Key links repeat at the bottom so you never scroll back to the top. Hover any link for a description.',
    placement: 'top',
  },
  {
    target: '[data-tour="tutorial-replay"]',
    title: "You're All Set!",
    summary: 'Replay this tour anytime.',
    content: 'Tap the Tutorial tile on the home dashboard or the Tutorial button in the nav bar to see this guide again.',
    keyboard: 'Escape skips. Arrow Right or Enter goes forward. Arrow Left goes back.',
    placement: 'bottom',
  },
];

function isElementVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}

function getSmartPlacement(el, preferred) {
  if (!el) return preferred;
  const rect = el.getBoundingClientRect();
  const nearBottom = rect.bottom > window.innerHeight - 140;
  const nearRight = rect.right > window.innerWidth - 160;
  const nearLeft = rect.left < 160;

  if (nearBottom && nearRight) return 'top-start';
  if (nearBottom && nearLeft) return 'top-end';
  if (nearBottom) return 'top';
  if (nearRight) return 'left';
  return preferred;
}

function scrollTargetIntoView(el, reducedMotion) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const tooltipSpace = 280;
  const needsScroll = rect.bottom > window.innerHeight - tooltipSpace
    || rect.top < 80
    || rect.right > window.innerWidth - 40;

  if (needsScroll) {
    el.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }
}

function buildVisibleSteps() {
  return TOUR_STEP_DEFS.filter((step) => {
    const matches = document.querySelectorAll(step.target);
    return Array.from(matches).some(isElementVisible);
  });
}

function buildStepAnnouncement(step, index, total) {
  return `Tutorial step ${index + 1} of ${total}. ${step.title}. ${step.summary}`;
}

function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isLastStep,
  tooltipRef,
}) {
  const titleId = useId();
  const descId = useId();
  const progress = ((index + 1) / size) * 100;

  return (
    <Box
      {...tooltipProps}
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={-1}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,51,102,0.25)',
        border: `2px solid ${VU_GOLD}`,
        width: 'min(400px, calc(100vw - 32px))',
        maxWidth: 'calc(100vw - 32px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        outline: 'none',
      }}
    >
      <Box sx={{ bgcolor: VU_NAVY, color: 'white', px: 2, py: 1.5, borderBottom: `3px solid ${VU_GOLD}` }}>
        <Typography id={titleId} variant="subtitle1" fontWeight={700} component="h2">
          {step.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, gap: 1 }}>
          <Typography variant="caption" sx={{ color: VU_GOLD, fontWeight: 600 }} aria-live="polite">
            Step {index + 1} of {size}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-hidden
          sx={{
            mt: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.15)',
            '& .MuiLinearProgress-bar': { bgcolor: VU_GOLD },
          }}
        />
      </Box>

      <Box id={descId} sx={{ px: 2, py: 2, maxHeight: 'min(45vh, 320px)', overflowY: 'auto' }}>
        <Typography variant="body2" fontWeight={700} color="primary" sx={{ mb: 1 }}>
          {step.summary}
        </Typography>
        <Typography variant="body2" lineHeight={1.7} color="text.secondary" sx={{ mb: 1.5 }}>
          {step.content}
        </Typography>

        {step.accessibility && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 1.5,
              mb: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(0, 51, 102, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
            }}
          >
            <AccessibilityNewIcon sx={{ color: VU_GOLD, fontSize: 20, mt: 0.2 }} aria-hidden />
            <Box>
              <Typography variant="caption" fontWeight={700} color="primary" display="block">
                Accessibility
              </Typography>
              <Typography variant="caption" lineHeight={1.6} color="text.secondary">
                {step.accessibility}
              </Typography>
            </Box>
          </Box>
        )}

        {step.keyboard && (
          <Chip
            icon={<KeyboardIcon aria-hidden />}
            label={step.keyboard}
            size="small"
            variant="outlined"
            sx={{ mb: 1.5, height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.4 } }}
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          <Button
            size="small"
            color="inherit"
            {...skipProps}
            aria-label="Skip tutorial"
            sx={{ minWidth: 0 }}
          >
            Skip tour
          </Button>
          <Box sx={{ flex: 1, minWidth: 8 }} />
          {index > 0 && (
            <Button
              size="small"
              variant="outlined"
              {...backProps}
              aria-label={`Go back to step ${index}`}
            >
              Back
            </Button>
          )}
          {continuous && (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              {...primaryProps}
              aria-label={isLastStep ? 'Finish tutorial' : `Continue to step ${index + 2}`}
              sx={{ minWidth: 72, fontWeight: 700 }}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function ProductTour() {
  const {
    open, step, setStep, completeTour, skipTour, pauseTour,
  } = useTutorial();
  const location = useLocation();
  const { announce } = useLiveRegion();
  const [ready, setReady] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const tooltipRef = useRef(null);
  const prevFocusRef = useRef(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return undefined;
    }

    if (location.pathname !== '/') {
      pauseTour();
      return undefined;
    }

    const timer = setTimeout(() => {
      const visible = buildVisibleSteps();
      if (visible.length === 0) {
        pauseTour();
        return;
      }
      setActiveSteps(visible);
      setStep((current) => (current >= visible.length ? 0 : current));
      setReady(true);
      prevFocusRef.current = document.activeElement;
      announce('Interactive tutorial started. Press Escape to skip.', 'polite');
    }, reducedMotion ? 80 : 300);

    return () => clearTimeout(timer);
  }, [open, location.pathname, pauseTour, reducedMotion, setStep, announce]);

  useEffect(() => {
    if (!open || !ready || !activeSteps[step]) return undefined;
    const current = activeSteps[step];
    const el = document.querySelector(current.target);
    if (current.focusTarget && el) {
      el.focus();
    }
    const t = setTimeout(() => scrollTargetIntoView(el, reducedMotion), 100);
    announce(buildStepAnnouncement(current, step, activeSteps.length), 'polite');
    const focusT = setTimeout(() => tooltipRef.current?.focus(), 200);
    return () => {
      clearTimeout(t);
      clearTimeout(focusT);
    };
  }, [open, ready, step, activeSteps, reducedMotion, announce]);

  const goNext = useCallback(() => {
    if (step >= activeSteps.length - 1) {
      announce('Tutorial complete.', 'polite');
      completeTour();
    } else {
      setStep(step + 1);
    }
  }, [step, activeSteps.length, completeTour, setStep, announce]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step, setStep]);

  const handleSkip = useCallback(() => {
    announce('Tutorial skipped.', 'polite');
    skipTour();
    prevFocusRef.current?.focus?.();
  }, [skipTour, announce]);

  useEffect(() => {
    if (!open || !ready) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, ready, goNext, goBack, handleSkip]);

  const joyrideStyles = useMemo(() => ({
    options: {
      primaryColor: VU_GOLD,
      zIndex: 10050,
      arrowColor: '#ffffff',
      backgroundColor: '#ffffff',
      textColor: VU_NAVY,
      overlayColor: 'rgba(0, 34, 68, 0.72)',
    },
    spotlight: {
      borderRadius: 10,
      boxShadow: `0 0 0 3px ${VU_GOLD}, 0 0 0 6px rgba(212, 175, 55, 0.35)`,
    },
    tooltip: { padding: 0 },
    tooltipContainer: { textAlign: 'left', maxWidth: 'calc(100vw - 32px)' },
    floater: { maxWidth: 'calc(100vw - 32px)' },
    buttonNext: { backgroundColor: VU_GOLD, color: VU_NAVY, fontWeight: 700 },
    buttonBack: { color: VU_NAVY },
    buttonSkip: { color: '#666' },
  }), []);

  const handleCallback = useCallback((data) => {
    const {
      action, index, status, type, step: stepData,
    } = data;

    if (status === STATUS.FINISHED) {
      announce('Tutorial complete.', 'polite');
      prevFocusRef.current?.focus?.();
      completeTour();
      return;
    }

    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      handleSkip();
      return;
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStep((prev) => Math.min(prev + 1, activeSteps.length - 1));
      return;
    }

    if (type === EVENTS.STEP_BEFORE) {
      const el = typeof stepData?.target === 'string'
        ? document.querySelector(stepData.target)
        : stepData?.target;
      if (stepData?.focusTarget && el) el.focus();
      scrollTargetIntoView(el, reducedMotion);
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        if (index >= activeSteps.length - 1) {
          completeTour();
        } else {
          setStep(index + 1);
        }
      } else if (action === ACTIONS.PREV) {
        setStep(index - 1);
      }
    }
  }, [completeTour, setStep, handleSkip, reducedMotion, announce, activeSteps.length]);

  const stepsWithPlacement = useMemo(() => activeSteps.map((s) => {
    const el = document.querySelector(s.target);
    const placement = getSmartPlacement(el, s.placement);
    return {
      ...s,
      placement,
      floaterProps: {
        options: {
          ...FLOATER_OPTIONS,
          placement,
          offset: s.offset ?? 12,
        },
      },
    };
  }), [activeSteps, step]);

  const TooltipWithRef = useCallback((props) => (
    <TourTooltip {...props} tooltipRef={tooltipRef} />
  ), []);

  if (!open || !ready || activeSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={stepsWithPlacement}
      run={open && ready}
      stepIndex={step}
      continuous
      showProgress={false}
      showSkipButton={false}
      disableOverlayClose
      disableCloseOnEsc
      spotlightClicks={false}
      scrollToFirstStep={false}
      scrollOffset={100}
      spotlightPadding={8}
      tooltipComponent={TooltipWithRef}
      floaterProps={{
        disableAnimation: reducedMotion,
        options: FLOATER_OPTIONS,
        styles: {
          floater: { maxWidth: 'min(400px, calc(100vw - 32px))', filter: 'none' },
          arrow: { length: 12, spread: 20, color: '#ffffff' },
        },
      }}
      styles={joyrideStyles}
      callback={handleCallback}
    />
  );
}

export function TutorialAutoStart() {
  const { shouldAutoStart, startTour, open } = useTutorial();
  const { pathname } = useLocation();
  const { announce } = useLiveRegion();

  useEffect(() => {
    if (!open && shouldAutoStart() && pathname === '/') {
      const t = setTimeout(() => {
        announce('Starting the product tour. Press Escape to skip.', 'polite');
        startTour();
      }, 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, shouldAutoStart, startTour, pathname, announce]);

  return null;
}
