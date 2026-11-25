import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import {
  colors,
  fonts,
  typography,
  type ColorName,
  type FontWeightName,
  type TextVariant,
} from '@/theme';

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  color?: ColorName;
  weight?: FontWeightName;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <NativeText
      {...rest}
      style={[
        typography[variant],
        { color: colors[color], textAlign: align },
        weight && { fontFamily: fonts[weight] },
        style,
      ]}
    />
  );
}
