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
    behavior: ['top', 'top-start', 'top-end', 'left', 'left-start', 'right', 'bottom'],
  },
};

const TOUR_STEP_DEFS = [
  {
    target: '[data-tour="home-hero"]',
    title: 'Welcome to VU Online Voting',
    summary: 'Your official, secure campus election portal.',
    content: 'This system lets eligible VU students register, verify their identity with a one-time password, cast an official ballot, and confirm their vote with a receipt. Everything you see here is designed for transparency and auditability.',
    accessibility: 'When you move between pages, a screen reader will hear the page name announced automatically. The highlighted area is the main hero banner on the Home page.',
    keyboard: 'Press Tab to move through the page. Press Shift+Tab to go backwards.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="skip-to-content"]',
    title: 'Skip to Main Content',
    summary: 'Keyboard and screen-reader users can bypass repetitive navigation.',
    content: 'The first Tab stop on every page is a “Skip to main content” link. It jumps directly to the primary page area so you do not have to tab through the entire header and menu each time.',
    accessibility: 'This link is visually hidden until focused, then appears in the top-left corner with a gold background. Screen readers will read it as the first focusable item.',
    keyboard: 'Press Tab once after loading any page to reach this link, then Enter to activate it.',
    placement: 'bottom',
    cornerTarget: true,
  },
  {
    target: '[data-tour="tile-grid"]',
    title: 'Home Dashboard Tiles',
    summary: 'A visual command centre for every major feature.',
    content: 'Each coloured tile is a shortcut — Vote, Elections, Live Results, Polls, Calendar, and more. Tiles show live badges such as how many elections are open. Hover or focus a tile to see a tooltip describing where it goes.',
    accessibility: 'Tiles are links with descriptive labels. Your screen reader will announce the tile title, subtitle, and any badge text.',
    keyboard: 'Use Tab to move between tiles. Press Enter or Space to open the selected tile.',
    placement: 'top',
  },
  {
    target: '[data-tour="tile-vote"]',
    title: 'Cast Your Official Vote',
    summary: 'Sign in required — this is where real ballots are submitted.',
    content: 'After logging in with your VU email and OTP, open this tile to see your open ballots. Select candidates for each position, review your choices, and submit. You will receive a unique receipt token to verify your vote later.',
    accessibility: 'The Vote tile is only visible when you are signed in. If you cannot see it, use Login or Register first.',
    keyboard: 'Tab to this tile and press Enter. You will be taken to My Ballots.',
    placement: 'right',
  },
  {
    target: '[data-tour="tile-elections"]',
    title: 'Browse Elections',
    summary: 'Search, filter, and open any campus election.',
    content: 'View all elections — voting open, upcoming, or finished. Type in the search box to find elections or candidates by name. Each election opens a hub with live standings, candidate profiles, discussion, and AI insights.',
    accessibility: 'Search results update as you type and are announced to screen readers. Filter tabs let you narrow results by election phase.',
    keyboard: 'Open this tile, then use Tab to reach the search field. Arrow keys work inside dropdown results.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tile-polls"]',
    title: 'Public Prediction Polls',
    summary: 'Community opinions — not official votes.',
    content: 'Polls let students share predictions and discuss outcomes. Results appear as bar charts with percentages. Poll votes are separate from official ballots and are clearly labelled as non-binding.',
    accessibility: 'Poll options are radio buttons or buttons with clear labels. Results charts include text percentages alongside visual bars.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="tile-live-results"]',
    title: 'Live Results & Scoreboard',
    summary: 'Real-time vote counts with animated standings.',
    content: 'Watch candidates compete on a championship-style scoreboard. Momentum bars, crown icons for leaders, and an interactive line chart show how voting trends change over time. Data refreshes automatically during active elections.',
    accessibility: 'Live updates are announced politely when vote counts change. Chart data is also available in tabular form on the results page.',
    placement: 'left',
  },
  {
    target: '[data-tour="nav-elections"]',
    title: 'Top Navigation — Elections',
    summary: 'Reach Elections from any page.',
    content: 'The navigation bar stays fixed at the top. The Elections link is always available and shows a tooltip on hover explaining its purpose. The current page is marked with aria-current for screen readers.',
    accessibility: 'Navigation links include aria-labels describing their destination. The active page link is highlighted in gold.',
    keyboard: 'Tab through the nav bar links. Press Enter to navigate.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-vote"]',
    title: 'Top Navigation — Vote',
    summary: 'Quick access to your ballots when signed in.',
    content: 'This highlighted link takes you directly to My Ballots so you can cast or review your vote without returning to the home tiles.',
    accessibility: 'Only visible when logged in as a student voter. The link is emphasised with a gold border so it stands out visually.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Your Voter Dashboard',
    summary: 'Track activity, profile, and voting history.',
    content: 'The Dashboard shows your account summary, recent notifications, and quick links to ballots and candidate applications.',
    accessibility: 'Dashboard cards use headings and landmarks so screen readers can jump between sections efficiently.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="global-search"]',
    title: 'Global Search (Ctrl+K)',
    summary: 'Find elections, candidates, polls, and pages instantly.',
    content: 'Open search from the magnifying-glass icon or press Ctrl+K (Cmd+K on Mac). Type a name or keyword — results are grouped by type. Recent searches are saved for quick access.',
    accessibility: 'Search results are announced as they load. Each result row describes the item type, title, and destination.',
    keyboard: 'Ctrl+K opens search. Arrow Up/Down moves through results. Enter selects. Escape closes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="help-chat"]',
    title: 'Help Chat Assistant',
    summary: 'AI-powered answers about voting and registration.',
    content: 'Tap the floating chat button in the bottom-right corner to ask questions about OTP login, how to vote, verifying receipts, or running as a candidate. Suggested questions help you get started quickly.',
    accessibility: 'The chat panel is a dialog with labelled input fields. Messages are readable by screen readers as they appear.',
    keyboard: 'Tab to the chat button and press Enter. Type your question and press Enter again to send.',
    placement: 'top-start',
    offset: 16,
    cornerTarget: true,
  },
  {
    target: '[data-tour="tile-verify"]',
    title: 'Verify Your Voting Receipt',
    summary: 'Confirm your ballot was recorded on the ledger.',
    content: 'After voting you receive a receipt token. Paste it here to verify your vote was counted without revealing who you voted for. This proves the system recorded your ballot correctly.',
    accessibility: 'The verification result is announced assertively — success or failure — so blind users know the outcome immediately.',
    placement: 'top',
  },
  {
    target: '[data-tour="a11y-toggle"]',
    title: 'Enhanced Accessibility Mode',
    summary: 'Stronger focus rings, underlined links, and larger tap targets.',
    content: 'Toggle this switch in the footer to enable enhanced accessibility. It adds gold focus outlines on every interactive element, underlines text links, enforces 44-pixel minimum button sizes, slightly increases text size, and disables decorative animations.',
    accessibility: 'When toggled, a confirmation message is spoken aloud. The setting is saved in your browser for future visits.',
    keyboard: 'Tab to the switch in the footer and press Space to toggle on or off.',
    placement: 'top',
    cornerTarget: true,
  },
  {
    target: '[data-tour="footer-links"]',
    title: 'Footer Quick Links',
    summary: 'Calendar, Help, Team, and more — always at the bottom.',
    content: 'The footer repeats key links so you never have to scroll back to the top. Each link has a descriptive tooltip. You will also find the GitHub repository link and NFR compliance badges here.',
    accessibility: 'Footer links use aria-labels matching their tooltips. The footer is a landmark region your screen reader can jump to directly.',
    placement: 'top',
    cornerTarget: true,
  },
  {
    target: '[data-tour="tutorial-replay"]',
    title: "You're All Set!",
    summary: 'Explore, vote, and replay this tour anytime.',
    content: 'You now know how to navigate the portal, cast a vote, check results, use search, enable accessibility enhancements, and get help. Tap the Tutorial button in the navigation bar whenever you want to see this guide again.',
    accessibility: 'This tour can be restarted from the Tutorial button or the Tutorial tile on the home dashboard. All steps are keyboard-operable.',
    keyboard: 'Escape skips the tour. Arrow Right or Enter goes to the next step. Arrow Left goes back.',
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
  const tooltipSpace = 320;
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
  return TOUR_STEP_DEFS.map((step) => {
    const matches = document.querySelectorAll(step.target);
    const visible = Array.from(matches).find(isElementVisible);
    if (!visible) return null;

    const placement = getSmartPlacement(visible, step.placement);

    return {
      ...step,
      target: visible,
      placement,
      floaterProps: {
        options: {
          ...FLOATER_OPTIONS,
          placement,
          offset: step.offset ?? 12,
        },
      },
    };
  }).filter(Boolean);
}

function buildStepAnnouncement(step, index, total) {
  const parts = [
    `Tutorial step ${index + 1} of ${total}.`,
    step.title,
    step.summary,
  ];
  if (step.accessibility) parts.push(`Accessibility tip: ${step.accessibility}`);
  return parts.join(' ');
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
            {Math.round(progress)}% complete
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

      <Box id={descId} sx={{ px: 2, py: 2, maxHeight: 'min(50vh, 360px)', overflowY: 'auto' }}>
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
                Screen reader &amp; accessibility
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mt: 1,
          }}
        >
          <Button
            size="small"
            color="inherit"
            {...skipProps}
            aria-label="Skip tutorial and mark as completed"
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
      announce('Interactive tutorial started. Use arrow keys to navigate steps, Escape to skip.', 'assertive');
    }, reducedMotion ? 100 : 450);

    return () => clearTimeout(timer);
  }, [open, location.pathname, pauseTour, reducedMotion, setStep, announce]);

  useEffect(() => {
    if (!open || !ready || !activeSteps[step]) return undefined;
    const current = activeSteps[step];
    const el = typeof current.target === 'string'
      ? document.querySelector(current.target)
      : current.target;
    const t = setTimeout(() => scrollTargetIntoView(el, reducedMotion), 100);
    announce(buildStepAnnouncement(current, step, activeSteps.length), 'assertive');
    const focusT = setTimeout(() => tooltipRef.current?.focus(), 200);
    return () => {
      clearTimeout(t);
      clearTimeout(focusT);
    };
  }, [open, ready, step, activeSteps, reducedMotion, announce]);

  const goNext = useCallback(() => {
    if (step >= activeSteps.length - 1) {
      announce('Tutorial complete. You can replay it anytime from the Tutorial button.', 'polite');
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
      setStep(index + 1);
      return;
    }

    if (type === EVENTS.STEP_BEFORE) {
      const el = typeof stepData?.target === 'string'
        ? document.querySelector(stepData.target)
        : stepData?.target;
      scrollTargetIntoView(el, reducedMotion);
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStep(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStep(index - 1);
      }
    }
  }, [completeTour, setStep, handleSkip, reducedMotion, announce]);

  const TooltipWithRef = useCallback((props) => (
    <TourTooltip {...props} tooltipRef={tooltipRef} />
  ), []);

  if (!open || !ready || activeSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={activeSteps}
      run={open && ready}
      stepIndex={step}
      continuous
      showProgress={false}
      showSkipButton={false}
      disableOverlayClose={false}
      disableCloseOnEsc
      spotlightClicks
      scrollToFirstStep
      scrollOffset={120}
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
        announce('First visit tutorial will begin shortly. Press Escape at any time to skip.', 'polite');
        startTour();
      }, 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, shouldAutoStart, startTour, pathname, announce]);

  return null;
}
