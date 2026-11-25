import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, sizes, spacing } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  /** Stays put above the bottom edge, such as a save bar. */
  footer?: ReactNode;
  /** For headers that draw behind the status bar. */
  edgeToEdge?: boolean;
  /** Adds the side gutter and gaps between sections. */
  padded?: boolean;
  testID?: string;
}

/** Outer frame of every screen: background, safe areas, scrolling and keyboard. */
export function Screen({ children, footer, edgeToEdge, padded = true, testID }: ScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView testID={testID} style={styles.root} behavior="padding">
      <ScrollView
        style={styles.root}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: edgeToEdge ? 0 : insets.top + spacing.xl },
          padded && styles.padded,
        ]}>
        {children}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

/** A bar of actions for `footer`, clear of the home indicator. */
export function FooterBar({ children }: PropsWithChildren) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {children}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: sizes.maxContentWidth,
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
  },
  padded: { paddingHorizontal: spacing.xl, gap: spacing.xxl },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
}));
