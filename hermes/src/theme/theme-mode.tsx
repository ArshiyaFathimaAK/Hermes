import { createContext, use, useState, type PropsWithChildren } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeModeValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeValue>({ mode: 'auto', setMode: () => {} });

/** Follows the device until someone picks light or dark. */
export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('auto');

  function setMode(next: ThemeMode) {
    setModeState(next);
    // Also themes the keyboard, alerts and status bar. The web has no equivalent.
    if (Platform.OS !== 'web') Appearance.setColorScheme(next);
  }

  return <ThemeModeContext value={{ mode, setMode }}>{children}</ThemeModeContext>;
}

export const useThemeMode = () => use(ThemeModeContext);
