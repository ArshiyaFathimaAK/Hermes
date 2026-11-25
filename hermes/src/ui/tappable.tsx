import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export interface TappableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

/** Anything tappable that isn't a Button: cards, rows, tiles. Owns press feedback. */
export function Tappable({ style, disabled, ...rest }: TappableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [style, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    />
  );
}
