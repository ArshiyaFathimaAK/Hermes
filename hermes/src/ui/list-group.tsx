import { Children, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/theme';

import { Icon } from './icon';
import { Tappable } from './tappable';
import { Text } from './text';

/** Rounded box of rows with dividers between them. */
export function ListGroup({ children }: PropsWithChildren) {
  return (
    <View style={styles.group}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={index > 0 && styles.divider}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Replaces the value and chevron. */
  trailing?: ReactNode;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  value,
  onPress,
  disabled,
  trailing,
  testID,
}: ListRowProps) {
  const content = (
    <>
      <View style={styles.text}>
        <Text variant="label">{title}</Text>
        {subtitle && (
          <Text variant="small" color="textMuted">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing ?? (
        <>
          {value && (
            <Text weight="medium" color="textMuted">
              {value}
            </Text>
          )}
          {onPress && <Icon name="chevronRight" size={18} color="textMuted" />}
        </>
      )}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.row, disabled && styles.disabled]}>
        {content}
      </View>
    );
  }
  return (
    <Tappable testID={testID} onPress={onPress} disabled={disabled} style={styles.row}>
      {content}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radius.xl,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: { borderTopWidth: sizes.hairline, borderTopColor: colors.borderSubtle },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: spacing.xxs },
  disabled: { opacity: 0.5 },
});
