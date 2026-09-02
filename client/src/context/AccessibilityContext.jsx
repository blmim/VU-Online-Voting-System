import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'vu-a11y-enhanced';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [enhanced, setEnhanced] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    document.body.classList.toggle('vu-a11y-enhanced', enhanced);
    try {
      localStorage.setItem(STORAGE_KEY, String(enhanced));
    } catch { /* ignore */ }
  }, [enhanced]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleEnhanced = useCallback(() => setEnhanced((v) => !v), []);
  const enableEnhanced = useCallback(() => setEnhanced(true), []);

  return (
    <AccessibilityContext.Provider value={{
      enhanced, toggleEnhanced, enableEnhanced, reducedMotion,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) return { enhanced: false, toggleEnhanced: () => {}, enableEnhanced: () => {}, reducedMotion: false };
  return ctx;
}
