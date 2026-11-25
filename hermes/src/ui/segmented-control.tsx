import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, sizes, spacing } from '@/theme';

import { Tappable } from './tappable';
import { Text } from './text';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Tappable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}>
            <Text
              weight={selected ? 'bold' : 'semibold'}
              color={selected ? 'text' : 'textMuted'}>
              {option.label}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  segment: {
    flexGrow: 1,
    flexBasis: 'auto',
    minWidth: sizes.control,
    minHeight: sizes.touch,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  selected: { backgroundColor: colors.background, ...shadows.low },
});
