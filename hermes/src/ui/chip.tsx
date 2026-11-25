import { StyleSheet } from 'react-native';

import { colors, radius, sizes, spacing, type ColorName } from '@/theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { Text } from './text';

type ChipVariant = 'outline' | 'primary' | 'inverse';

interface ChipProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  iconColor?: ColorName;
  selected?: boolean;
  variant?: ChipVariant;
  accessibilityLabel?: string;
  testID?: string;
}

/** Pill-shaped choice or shortcut. `selected` fills it black. */
export function Chip({
  label,
  onPress,
  icon,
  iconColor,
  selected = false,
  variant = 'outline',
  accessibilityLabel,
  testID,
}: ChipProps) {
  const color: ColorName = selected || variant !== 'outline' ? 'textOnInverse' : 'text';
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      testID={testID}
      style={[styles.base, styles[variant], selected && styles.selected]}>
      {icon && <Icon name={icon} size={18} color={iconColor ?? color} />}
      <Text variant="small" weight="semibold" color={color}>
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: sizes.hairline,
  },
  outline: { borderColor: colors.borderStrong, backgroundColor: colors.background },
  primary: { borderColor: colors.action, backgroundColor: colors.action },
  inverse: { borderColor: colors.inverseSurface, backgroundColor: colors.inverseSurface },
  selected: { borderColor: colors.inverse, backgroundColor: colors.inverse },
});
