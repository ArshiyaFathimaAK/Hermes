import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, type ColorName } from '@/theme';

import { Text } from './text';

type BadgeVariant = 'inverse' | 'primary' | 'light' | 'overlay';

const FOREGROUND: Record<BadgeVariant, ColorName> = {
  inverse: 'textOnInverse',
  primary: 'onAction',
  light: 'text',
  overlay: 'textOnInverse',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

/** Small label. Never tappable. */
export function Badge({ label, variant = 'inverse', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text variant="caption" weight="bold" color={FOREGROUND[variant]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  inverse: { backgroundColor: colors.inverse },
  primary: { backgroundColor: colors.action },
  light: { backgroundColor: colors.background },
  overlay: { backgroundColor: colors.photoOverlay },
});
