
import type { Activity } from '@/domain/activity';
import { createStyles, radius, sizes, spacing } from '@/theme';
import { Icon } from '@/ui/icon';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';

interface PlanItemProps {
  activity?: Activity;
  /** Without it the item is read-only. */
  onPress?: () => void;
  testID?: string;
}

export function PlanItem({ activity, onPress, testID }: PlanItemProps) {
  const styles = useStyles();
  return (
    <Tappable
      testID={testID}
      disabled={false}
      accessibilityRole={onPress ? 'button' : 'text'}
      onPress={onPress}
      style={styles.item}>
      <Text variant="label" weight="bold">
        {activity?.name ?? 'No longer available'}
      </Text>
      {activity && (
        <Text variant="caption" color="textMuted">
          {[activity.type, activity.duration].filter(Boolean).join(' · ')}
        </Text>
      )}
    </Tappable>
  );
}

export function AddItem({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <Tappable accessibilityLabel="Add something" onPress={onPress} style={styles.add}>
      <Icon name="add" size={18} color="actionText" />
      <Text weight="semibold" color="actionText">
        Add something
      </Text>
    </Tappable>
  );
}

const useStyles = createStyles((colors) => ({
  item: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.actionBorder,
  },
}));
