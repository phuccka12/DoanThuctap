import React, { createContext, useContext, useState, useEffect } from 'react';

const IconModeContext = createContext(null);

export function IconModeProvider({ children, defaultMode = 'compact' }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('iconMode');
      return stored || defaultMode;
    } catch (e) {
      return defaultMode;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('iconMode', mode); } catch (e) { /* ignore */ }
  }, [mode]);

  const value = { mode, setMode };
  return <IconModeContext.Provider value={value}>{children}</IconModeContext.Provider>;
}

export function useIconMode() {
  const ctx = useContext(IconModeContext);
  if (!ctx) throw new Error('useIconMode must be used within IconModeProvider');
  return ctx;
}

export default IconModeContext;
