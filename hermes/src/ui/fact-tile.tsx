import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles, radius, spacing } from '@/theme';
import { Text } from '@/ui/text';

interface FactTileProps {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
}

export function FactTile({ label, value, note, icon }: FactTileProps) {
  const styles = useStyles();
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

const useStyles = createStyles((colors) => ({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  value: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
}));
