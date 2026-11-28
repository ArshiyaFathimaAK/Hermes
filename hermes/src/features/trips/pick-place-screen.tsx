import { goBack } from '@/navigation/routes';
import { AsyncView } from '@/ui/async-view';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Message } from '@/ui/message';
import { Screen } from '@/ui/screen';
import { SearchField } from '@/ui/search-field';
import { Section } from '@/ui/section';
import { SheetHeader } from '@/ui/sheet-header';

import { usePickPlace } from './use-pick-place';

export function PickPlaceScreen({ tripId }: { tripId?: string }) {
  const { query, setQuery, isSearching, places, trip, pick } = usePickPlace(tripId);

  return (
    <Screen testID="pick-place-screen">
      <SheetHeader
        title={trip ? `Add to ${trip.name}` : 'New trip'}
        subtitle={trip ? 'Where else are you going?' : 'Where are you going?'}
        onClose={goBack}
      />
      <SearchField
        testID="pick-place-search"
        label="Search a place"
        placeholder="Search a city or region"
        value={query}
        onChangeText={setQuery}
      />
      <AsyncView state={places}>
        {(results) => {
          const available = results.filter((place) => !trip?.placeIds.includes(place.id));
          if (available.length === 0) {
            return isSearching && <Message title="No places match that yet" />;
          }
          return (
            <Section title={isSearching ? 'Results' : 'Recent'}>
              <ListGroup>
                {available.map((place) => (
                  <ListRow
                    key={place.id}
                    testID={`pick-${place.id}`}
                    title={place.name}
                    subtitle={place.region}
                    onPress={() => pick(place)}
                  />
                ))}
              </ListGroup>
            </Section>
          );
        }}
      </AsyncView>
    </Screen>
  );
}
