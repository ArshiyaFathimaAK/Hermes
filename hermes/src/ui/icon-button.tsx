import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, shadows, sizes, type ColorName } from '@/theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';

type IconButtonVariant = 'plain' | 'onInverse' | 'raised' | 'primary' | 'outline';

const FOREGROUND: Record<IconButtonVariant, ColorName> = {
  plain: 'text',
  onInverse: 'textOnInverse',
  raised: 'text',
  primary: 'onAction',
  outline: 'action',
};

interface IconButtonProps {
  icon: IconName;
  /** Read aloud by screen readers. */
  label: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  disabled,
  selected,
  style,
  testID,
}: IconButtonProps) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      testID={testID}
      style={[
        styles.base,
        variant === 'raised' && styles.raised,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        style,
      ]}>
      <Icon name={icon} size={22} color={FOREGROUND[variant]} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: sizes.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raised: { backgroundColor: colors.background, ...shadows.medium },
  primary: { backgroundColor: colors.action },
  outline: { borderWidth: 2, borderColor: colors.action },
});
