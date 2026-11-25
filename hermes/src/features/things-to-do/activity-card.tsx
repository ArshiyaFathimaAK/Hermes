import { StyleSheet, View } from 'react-native';

import type { Activity } from '@/domain/activity';
import { colors, radius, shadows, sizes, spacing } from '@/theme';
import { Badge } from '@/ui/badge';
import { Icon } from '@/ui/icon';
import { Photo } from '@/ui/photo';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';

interface ActivityCardProps {
  activity: Activity;
  saved: boolean;
  onPress: () => void;
  onToggleSaved: () => void;
}

export function ActivityCard({ activity, saved, onPress, onToggleSaved }: ActivityCardProps) {
  const color = saved ? 'onAction' : 'action';
  return (
    <View style={styles.card}>
      <Tappable
        testID={`activity-${activity.id}`}
        accessibilityLabel={`${activity.name}: see details`}
        onPress={onPress}>
        <Photo source={activity.image} alt={activity.name} style={styles.photo}>
          {activity.bookable && (
            <Badge variant="light" label="Bookable tour" style={styles.topLeft} />
          )}
          {activity.photoCredit && (
            <Badge variant="overlay" label={activity.photoCredit} style={styles.bottomRight} />
          )}
        </Photo>
        <View style={styles.body}>
          <Text variant="subheading">{activity.name}</Text>
          <View style={styles.row}>
            {activity.rating !== undefined && (
              <>
                <Icon name="star" size={14} />
                <Text variant="small" weight="bold">
                  {activity.rating}
                </Text>
                {activity.reviewCount && (
                  <Text variant="small" color="textSecondary">
                    ({activity.reviewCount}) ·
                  </Text>
                )}
              </>
            )}
            <Text variant="small" color="textSecondary">
              {activity.type}
            </Text>
          </View>
          {activity.summary && <Text color="textSecondary">{activity.summary}</Text>}
          <View style={styles.row}>
            <Icon name="pin" size={16} color="action" />
            <Text variant="small" weight="semibold" style={styles.fill}>
              {activity.where}
            </Text>
          </View>
          <View style={styles.row}>
            <Text variant="small" color="textMuted">
              {activity.status}
            </Text>
            {activity.duration && (
              <>
                <Icon name="clock" size={15} color="textMuted" />
                <Text variant="small" color="textMuted">
                  {activity.duration}
                </Text>
              </>
            )}
          </View>
          <View style={styles.row}>
            <Text variant="small" weight="bold" style={styles.fill}>
              {activity.priceLabel}
            </Text>
            <Text variant="small" weight="bold" color="action">
              Details
            </Text>
            <Icon name="chevronRight" size={16} color="action" />
          </View>
        </View>
      </Tappable>
      <Tappable
        testID={`save-${activity.id}`}
        accessibilityLabel={
          saved ? `Remove ${activity.name} from trip` : `Save ${activity.name} to trip`
        }
        accessibilityState={{ selected: saved }}
        onPress={onToggleSaved}
        style={[styles.save, saved && styles.saved]}>
        <Icon name={saved ? 'check' : 'add'} size={18} color={color} />
        <Text variant="small" weight="bold" color={color}>
          {saved ? 'Saved' : 'Save'}
        </Text>
      </Tappable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  photo: { height: 170 },
  topLeft: { position: 'absolute', left: spacing.md, top: spacing.md },
  bottomRight: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  body: { gap: spacing.sm, padding: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs + spacing.xxs },
  fill: { flex: 1 },
  save: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touch,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    ...shadows.medium,
  },
  saved: { backgroundColor: colors.action },
});
