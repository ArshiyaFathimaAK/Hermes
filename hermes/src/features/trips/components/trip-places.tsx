import { StyleSheet, View } from 'react-native';

import type { Place } from '@/domain/place';
import { spacing } from '@/theme';
import { Chip } from '@/ui/chip';
import { Section } from '@/ui/section';

interface TripPlacesProps {
  places: Place[];
  onOpen: (placeId: string) => void;
  onAdd: () => void;
}

export function TripPlaces({ places, onOpen, onAdd }: TripPlacesProps) {
  return (
    <Section title="Places">
      <View style={styles.row}>
        {places.map((place) => (
          <Chip
            key={place.id}
            testID={`trip-place-${place.id}`}
            icon="pin"
            iconColor="action"
            label={place.name}
            accessibilityLabel={`Open ${place.name}`}
            onPress={() => onOpen(place.id)}
          />
        ))}
        <Chip testID="add-place" icon="add" iconColor="action" label="Add place" onPress={onAdd} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
