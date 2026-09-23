import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorTokens, ThemeMode, colorsFor } from './tokens';

interface ThemeContextValue {
  mode: ThemeMode;
  followSystem: boolean;
  colors: ColorTokens;
  setDarkMode: (dark: boolean) => void;
  setFollowSystem: (follow: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [followSystem, setFollowSystem] = useState(true);
  const [manualDark, setManualDark] = useState(false);

  const mode: ThemeMode = followSystem ? (system === 'dark' ? 'dark' : 'light') : manualDark ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      followSystem,
      colors: colorsFor(mode),
      setDarkMode: (dark: boolean) => {
        setFollowSystem(false);
        setManualDark(dark);
      },
      setFollowSystem,
    }),
    [mode, followSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
