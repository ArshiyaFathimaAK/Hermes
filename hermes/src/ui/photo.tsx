import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';

import { colors } from '@/theme';

interface PhotoProps extends PropsWithChildren {
  source: ImageProps['source'];
  alt: string;
  style?: StyleProp<ViewStyle>;
}

/** Image with a tinted background while it loads. Children sit on top. */
export function Photo({ source, alt, style, children }: PhotoProps) {
  return (
    <View style={[styles.frame, style]}>
      {source ? (
        <Image source={source} alt={alt} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.photo },
});
