import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, type ColorName } from '@/theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';
import { Text } from './text';

type ButtonVariant = 'primary' | 'soft' | 'outline' | 'quiet' | 'plain' | 'plainOnInverse';

const FOREGROUND: Record<ButtonVariant, ColorName> = {
  primary: 'onAction',
  soft: 'action',
  outline: 'text',
  quiet: 'text',
  plain: 'action',
  plainOnInverse: 'actionOnInverse',
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  selected,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const color = FOREGROUND[variant];
  const isPlain = variant === 'plain' || variant === 'plainOnInverse';
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected }}
      testID={testID}
      style={[styles.base, isPlain ? styles.plain : styles.solid, isPlain ? null : styles[variant as keyof typeof styles], style]}>
      {icon && <Icon name={icon} size={isPlain ? 16 : 18} color={color} />}
      <Text variant={isPlain ? 'body' : 'label'} weight="bold" color={color}>
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  solid: {
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  plain: { minHeight: sizes.touch, paddingHorizontal: spacing.xs },
  primary: { backgroundColor: colors.action },
  soft: { backgroundColor: colors.actionSoft },
  outline: { borderWidth: 1.5, borderColor: colors.text },
  quiet: { borderWidth: sizes.hairline, borderColor: colors.border },
});
