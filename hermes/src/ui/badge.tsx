import { View, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles, radius, spacing, type ColorName } from '@/theme';

import { Text } from './text';

type BadgeVariant = 'frame' | 'primary' | 'raised' | 'overlay';

const FOREGROUND: Record<BadgeVariant, ColorName> = {
  frame: 'textOnFrame',
  primary: 'onAction',
  raised: 'text',
  overlay: 'textOnPhoto',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

/** Small label. Never tappable. */
export function Badge({ label, variant = 'frame', style }: BadgeProps) {
  const styles = useStyles();
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text variant="caption" weight="bold" color={FOREGROUND[variant]}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  frame: { backgroundColor: colors.badge },
  primary: { backgroundColor: colors.action },
  raised: { backgroundColor: colors.raised },
  overlay: { backgroundColor: colors.photoOverlay },
}));
