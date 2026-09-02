import { createContext, useContext, useState, useMemo } from 'react';

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [override, setOverride] = useState(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverride() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) return { override: null, setOverride: () => {} };
  return ctx;
}
