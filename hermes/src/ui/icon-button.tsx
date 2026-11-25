import { type StyleProp, type ViewStyle } from 'react-native';

import { createStyles, shadows, sizes, type ColorName } from '@/theme';

import { Icon, type IconName } from './icon';
import { Tappable } from './tappable';

type IconButtonVariant = 'plain' | 'onFrame' | 'raised' | 'primary' | 'outline';

const FOREGROUND: Record<IconButtonVariant, ColorName> = {
  plain: 'text',
  onFrame: 'textOnFrame',
  raised: 'text',
  primary: 'onAction',
  outline: 'actionText',
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
  const styles = useStyles();
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

const useStyles = createStyles((colors) => ({
  base: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: sizes.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raised: { backgroundColor: colors.raised, ...shadows.medium },
  primary: { backgroundColor: colors.action },
  outline: { borderWidth: 2, borderColor: colors.actionText },
}));
