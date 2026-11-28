import { StyleSheet, View } from 'react-native';

import type { Activity } from '@/domain/activity';
import type { IsoDate } from '@/domain/dates';
import type { TripItem } from '@/domain/trip';
import type { DailyWeather } from '@/domain/weather';
import { CONDITION_LABELS } from '@/features/weather';
import { useTemperature } from '@/state/preferences';
import { spacing } from '@/theme';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import { formatLong } from '@/utils/dates';

import { SLOT_LABELS, itemsBySlot } from '../plan';
import { AddItem, PlanItem } from './plan-item';

interface DayPlanProps {
  day: number;
  date: IsoDate;
  items: TripItem[];
  activities: Map<string, Activity>;
  weather?: DailyWeather;
  /** Leave both out for a read-only plan. */
  onPressItem?: (item: TripItem) => void;
  onAdd?: () => void;
}

export function DayPlan({ day, date, items, activities, weather, onPressItem, onAdd }: DayPlanProps) {
  const formatTemp = useTemperature();
  return (
    <View style={styles.plan}>
      <View style={styles.heading}>
        <Text variant="subheading" accessibilityRole="header">
          {formatLong(date)}
        </Text>
        {weather && (
          <View style={styles.weather}>
            <Icon name={weather.condition} size={18} color="textMuted" />
            <Text color="textMuted">
              {formatTemp(weather.high)} / {formatTemp(weather.low)} ·{' '}
              {CONDITION_LABELS[weather.condition]}
              {weather.isTypical ? ' (typical)' : ''}
            </Text>
          </View>
        )}
      </View>
      {itemsBySlot(items, day).map(({ slot, items: slotItems }) => (
        <View key={slot} style={styles.slot}>
          <Text variant="caption" weight="semibold" color="textMuted" style={styles.slotLabel}>
            {SLOT_LABELS[slot]}
          </Text>
          <View style={styles.slotItems}>
            {slotItems.map((item) => (
              <PlanItem
                key={item.activityId}
                testID={`plan-${item.activityId}`}
                activity={activities.get(item.activityId)}
                onPress={onPressItem && (() => onPressItem(item))}
              />
            ))}
            {slotItems.length === 0 &&
              (onAdd ? <AddItem onPress={onAdd} /> : <Text color="textMuted" style={styles.empty}>Nothing planned</Text>)}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plan: { gap: spacing.md },
  heading: { gap: spacing.xs },
  weather: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  slot: { flexDirection: 'row', gap: spacing.md },
  slotLabel: { width: 72, paddingTop: spacing.lg },
  empty: { paddingTop: spacing.md },
  slotItems: { flex: 1, gap: spacing.sm },
});
