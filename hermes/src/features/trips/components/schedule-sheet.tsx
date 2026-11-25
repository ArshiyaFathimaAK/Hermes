import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DAY_SLOTS, type Trip, type TripItem } from '@/domain/trip';
import type { IsoDate } from '@/domain/dates';
import { routes } from '@/navigation/routes';
import { useTrips } from '@/state/trips';
import { spacing } from '@/theme';
import { BottomSheet } from '@/ui/bottom-sheet';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Section } from '@/ui/section';
import { formatShort, formatWeekday } from '@/utils/dates';

import { SLOT_LABELS } from '../plan';

interface ScheduleSheetProps {
  trip: Trip;
  item: TripItem;
  name: string;
  days: IsoDate[];
  onClose: () => void;
}

/** UC-10 Build Itinerary: choose a day and time, reorder, or remove. */
export function ScheduleSheet({ trip, item, name, days, onClose }: ScheduleSheetProps) {
  const { scheduleItem, moveItem, removeItem } = useTrips();
  const { schedule } = item;
  const set = (next: Partial<NonNullable<TripItem['schedule']>>) =>
    scheduleItem(trip.id, item.activityId, { day: 0, slot: 'morning', ...schedule, ...next });

  return (
    <BottomSheet
      visible
      title={name}
      onClose={onClose}
      footer={<Button label="Done" onPress={onClose} />}>
      {days.length > 0 && (
        <>
          <Section title="Day">
            <View style={styles.wrap}>
              {days.map((date, day) => (
                <Chip
                  key={date}
                  testID={`schedule-day-${day}`}
                  label={`${formatWeekday(date)}, ${formatShort(date)}`}
                  selected={schedule?.day === day}
                  onPress={() => set({ day })}
                />
              ))}
            </View>
          </Section>
          <Section title="Time of day">
            <View style={styles.wrap}>
              {DAY_SLOTS.map((slot) => (
                <Chip
                  key={slot}
                  label={SLOT_LABELS[slot]}
                  selected={schedule?.slot === slot}
                  onPress={() => set({ slot })}
                />
              ))}
            </View>
          </Section>
        </>
      )}
      {schedule && (
        <Section title="Order">
          <View style={styles.wrap}>
            <Chip
              icon="chevronUp"
              label="Earlier"
              onPress={() => moveItem(trip.id, item.activityId, -1)}
            />
            <Chip
              icon="chevronDown"
              label="Later"
              onPress={() => moveItem(trip.id, item.activityId, 1)}
            />
            <Chip
              label="Take off this day"
              onPress={() => scheduleItem(trip.id, item.activityId, undefined)}
            />
          </View>
        </Section>
      )}
      <View style={styles.wrap}>
        <Button
          variant="plain"
          label="See details"
          onPress={() => {
            onClose();
            router.push(routes.activity(item.activityId));
          }}
        />
        <Button
          variant="plain"
          label="Remove from trip"
          onPress={() => {
            onClose();
            removeItem(trip.id, item.activityId);
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
