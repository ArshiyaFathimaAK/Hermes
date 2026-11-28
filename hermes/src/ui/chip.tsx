
import { createStyles, radius, sizes, spacing, type ColorName } from '@/theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { Text } from './text';

type ChipVariant = 'outline' | 'primary' | 'onFrame';

const FOREGROUND: Record<ChipVariant, ColorName> = {
  outline: 'text',
  primary: 'onAction',
  onFrame: 'textOnFrame',
};

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

/** Pill-shaped choice or shortcut. `selected` fills it in. */
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
  const styles = useStyles();
  const color: ColorName = selected ? 'onSelected' : FOREGROUND[variant];
  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      testID={testID}
      style={[styles.base, styles[variant], selected && styles.selected]}>
      {icon && <Icon name={icon} size={18} color={selected ? color : (iconColor ?? color)} />}
      <Text variant="small" weight="semibold" color={color}>
        {label}
      </Text>
    </Tappable>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: sizes.hairline,
  },
  outline: { borderColor: colors.borderStrong },
  primary: { borderColor: colors.action, backgroundColor: colors.action },
  onFrame: { borderColor: colors.frameSurface, backgroundColor: colors.frameSurface },
  selected: { borderColor: colors.selected, backgroundColor: colors.selected },
}));
