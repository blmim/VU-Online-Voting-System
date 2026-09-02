import { createContext, useCallback, useContext, useState } from 'react';

const STORAGE_KEY = 'vu_tutorial_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const startTour = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setStep(0);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setStep(0);
  }, []);

  const pauseTour = useCallback(() => {
    setOpen(false);
    setStep(0);
  }, []);

  const shouldAutoStart = useCallback(
    () => !localStorage.getItem(STORAGE_KEY),
    [],
  );

  return (
    <TutorialContext.Provider value={{
      open, step, setStep, startTour, completeTour, skipTour, pauseTour, shouldAutoStart,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    return {
      open: false,
      step: 0,
      setStep: () => {},
      startTour: () => {},
      completeTour: () => {},
      skipTour: () => {},
      pauseTour: () => {},
      shouldAutoStart: () => false,
    };
  }
  return ctx;
};
