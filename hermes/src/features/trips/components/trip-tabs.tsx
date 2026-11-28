import { ScrollView, StyleSheet } from 'react-native';

import type { Trip } from '@/domain/trip';
import { spacing } from '@/theme';
import { Chip } from '@/ui/chip';

interface TripTabsProps {
  trips: Trip[];
  activeId: string;
  onSelect: (tripId: string) => void;
  onNew: () => void;
}

/** Every trip is one tap away. */
export function TripTabs({ trips, activeId, onSelect, onNew }: TripTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {trips.map((trip) => (
        <Chip
          key={trip.id}
          testID={`trip-${trip.id}`}
          label={trip.name}
          accessibilityLabel={`${trip.name} trip`}
          selected={trip.id === activeId}
          onPress={() => onSelect(trip.id)}
        />
      ))}
      <Chip testID="new-trip" icon="add" iconColor="actionText" label="New trip" onPress={onNew} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginHorizontal: -spacing.xl },
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl },
});
