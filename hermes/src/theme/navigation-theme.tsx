import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect, type PropsWithChildren } from 'react';

import { useColors, useIsDark } from './use-colors';

/** Colors behind screens, so nothing flashes white during transitions. */
export function NavigationTheme({ children }: PropsWithChildren) {
  const isDark = useIsDark();
  const colors = useColors();
  const base = isDark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
          primary: colors.actionText,
        },
      }}>
      {children}
    </ThemeProvider>
  );
}
