import { useSyncExternalStore } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { darkColors, lightColors, type Colors } from './colors';
import { useThemeMode } from './theme-mode';

type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

const noSubscription = () => () => {};

/** The theme picked in Account, or the device's. */
export function useIsDark() {
  const { mode } = useThemeMode();
  const scheme = useColorScheme();
  // The web server can't know the theme, so the first web render is light to match it.
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  if (mode !== 'auto') return mode === 'dark';
  return hydrated && scheme === 'dark';
}

export function useColors(): Colors {
  return useIsDark() ? darkColors : lightColors;
}

/**
 * StyleSheet.create for styles that use colors. Returns a hook:
 *
 *   const styles = useStyles();              // in the component
 *   const useStyles = createStyles((colors) => ({ box: { backgroundColor: colors.surface } }));
 */
export function createStyles<T extends NamedStyles<T>>(build: (colors: Colors) => T & NamedStyles<T>) {
  const light = StyleSheet.create(build(lightColors));
  const dark = StyleSheet.create(build(darkColors));
  return function useStyles() {
    return useIsDark() ? dark : light;
  };
}
