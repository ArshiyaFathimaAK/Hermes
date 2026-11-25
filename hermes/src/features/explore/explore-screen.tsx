import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Place } from '@/domain/place';
import { routes } from '@/navigation/routes';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Chip } from '@/ui/chip';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Message } from '@/ui/message';
import { Screen } from '@/ui/screen';
import { SearchField } from '@/ui/search-field';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';

import { UpNextCard } from './up-next-card';
import { useExplore } from './use-explore';

const openPlace = (place: Place) => router.push(routes.place(place.id));

export function ExploreScreen() {
  const { query, setQuery, isSearching, results, recent, upNext } = useExplore();

  return (
    <Screen testID="explore-screen">
      <Text variant="title" accessibilityRole="header">
        Where to?
      </Text>
      <SearchField
        testID="place-search"
        label="Search a place"
        placeholder="Search a city or region"
        value={query}
        onChangeText={setQuery}
      />
      {isSearching ? (
        <AsyncView state={results}>
          {(places) =>
            places.length === 0 ? (
              <Message title="No places match that yet" body="Try a city name." />
            ) : (
              <ListGroup>
                {places.map((place) => (
                  <ListRow
                    key={place.id}
                    testID={`place-${place.id}`}
                    title={place.name}
                    subtitle={place.region}
                    onPress={() => openPlace(place)}
                  />
                ))}
              </ListGroup>
            )
          }
        </AsyncView>
      ) : (
        <>
          <AsyncView state={recent}>
            {(places) =>
              places.length > 0 && (
                <Section title="Recent">
                  <View style={styles.chips}>
                    {places.map((place) => (
                      <Chip
                        key={place.id}
                        icon="clock"
                        label={place.name}
                        onPress={() => openPlace(place)}
                      />
                    ))}
                  </View>
                </Section>
              )
            }
          </AsyncView>
          {upNext && (
            <Section title="Up next">
              <UpNextCard trip={upNext} />
            </Section>
          )}
          <Text color="textMuted">
            Search any place to see what to do there, the weather, and where to stay.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
