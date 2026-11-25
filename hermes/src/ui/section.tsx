import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './text';

interface SectionProps extends PropsWithChildren {
  title: string;
  /** `quiet` is the small grey label; `strong` is a real heading. */
  tone?: 'quiet' | 'strong';
}

export function Section({ title, tone = 'quiet', children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        variant={tone === 'quiet' ? 'small' : 'subheading'}
        weight={tone === 'quiet' ? 'bold' : undefined}
        color={tone === 'quiet' ? 'textMuted' : 'text'}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: spacing.md } });
