import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { getBreadcrumbTrail } from '../constants/breadcrumbs';

const LiveRegionContext = createContext(null);

function VisuallyHidden({ children, live = 'polite', atomic = true }) {
  return (
    <div
      role="status"
      aria-live={live}
      aria-atomic={atomic}
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </div>
  );
}

function RouteAnnouncer() {
  const { pathname } = useLocation();
  const { announce } = useLiveRegion();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const trail = getBreadcrumbTrail(pathname);
    const pageName = trail[trail.length - 1]?.label || 'Page';
    announce(`Navigated to ${pageName} page`);
  }, [pathname, announce]);

  return null;
}

export function LiveRegionProvider({ children }) {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');
  const politeTimer = useRef(null);
  const assertiveTimer = useRef(null);

  const announce = useCallback((message, priority = 'polite') => {
    if (!message) return;
    if (priority === 'assertive') {
      setAssertiveMsg('');
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
      assertiveTimer.current = setTimeout(() => setAssertiveMsg(message), 60);
    } else {
      setPoliteMsg('');
      if (politeTimer.current) clearTimeout(politeTimer.current);
      politeTimer.current = setTimeout(() => setPoliteMsg(message), 60);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <VisuallyHidden live="polite">{politeMsg}</VisuallyHidden>
      <VisuallyHidden live="assertive">{assertiveMsg}</VisuallyHidden>
      <RouteAnnouncer />
    </LiveRegionContext.Provider>
  );
}

export function useLiveRegion() {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    return { announce: () => {} };
  }
  return ctx;
}

export default function LiveRegionAnnouncer() {
  return null;
}
