import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Stays } from '@/features/stays';
import { ThingsToDo } from '@/features/things-to-do';
import type { PlaceView } from '@/navigation/routes';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Screen } from '@/ui/screen';
import { SegmentedControl } from '@/ui/segmented-control';

import { DestinationHeader } from './destination-header';
import { TripBar } from './trip-bar';
import { useDestination } from './use-destination';

const VIEWS: { value: PlaceView; label: string }[] = [
  { value: 'things-to-do', label: 'Things to do' },
  { value: 'stays', label: 'Places to stay' },
];

interface DestinationScreenProps {
  placeId: string;
  view: PlaceView;
}

export function DestinationScreen({ placeId, view }: DestinationScreenProps) {
  const { place, dates, trip } = useDestination(placeId);
  return (
    <Screen
      testID="destination-screen"
      edgeToEdge={place.status === 'ready'}
      padded={false}
      footer={trip && <TripBar trip={trip} />}>
      <AsyncView state={place}>
        {(loaded) => (
          <>
            <DestinationHeader place={loaded} dates={dates} />
            <View style={styles.switch}>
              <SegmentedControl
                label="View"
                options={VIEWS}
                value={view}
                onChange={(next) => router.setParams({ view: next })}
              />
            </View>
            {view === 'stays' ? <Stays place={loaded} /> : <ThingsToDo place={loaded} />}
          </>
        )}
      </AsyncView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
});
