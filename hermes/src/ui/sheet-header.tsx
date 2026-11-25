import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { IconButton } from './icon-button';
import { Text } from './text';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

/** Title and close button for bottom sheets and modal screens. */
export function SheetHeader({ title, subtitle, onClose }: SheetHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {subtitle && <Text color="textMuted">{subtitle}</Text>}
      </View>
      <IconButton icon="close" label="Close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  text: { flex: 1, gap: spacing.xs, paddingTop: spacing.sm },
});
