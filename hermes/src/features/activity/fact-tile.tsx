import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { Text } from '@/ui/text';

interface FactTileProps {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
}

export function FactTile({ label, value, note, icon }: FactTileProps) {
  return (
    <View style={styles.tile}>
      <Text variant="caption" weight="semibold" color="textMuted">
        {label}
      </Text>
      <View style={styles.value}>
        {icon}
        <Text variant="label" weight="bold">
          {value}
        </Text>
      </View>
      {note && (
        <Text variant="caption" color="textMuted">
          {note}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  value: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
