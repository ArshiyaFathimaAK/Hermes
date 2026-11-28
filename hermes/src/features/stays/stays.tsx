import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Place } from '@/domain/place';
import { routes } from '@/navigation/routes';
import { useAccountGate } from '@/state/session';
import { useTrips } from '@/state/trips';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { BottomSheet } from '@/ui/bottom-sheet';
import { Button } from '@/ui/button';
import { FilterBar } from '@/ui/filter-bar';
import { ListGroup, ListRow } from '@/ui/list-group';
import { MapView } from '@/ui/map-view';
import { Message } from '@/ui/message';
import { Text } from '@/ui/text';
import { daysBetween, formatRange } from '@/utils/dates';
import { formatMoney, pluralize } from '@/utils/format';

import { STAY_FILTERS, STAY_SORTS } from './filter-stays';
import { StayRow } from './stay-row';
import { useStays } from './use-stays';

export function Stays({ place }: { place: Place }) {
  const { datesForPlace, tripForPlace, toggleStay } = useTrips();
  const dates = datesForPlace(place.id);
  const { all, visible, filters, setFilters, sort, setSort } = useStays(place.id, dates);
  const gate = useAccountGate();
  const [sorting, setSorting] = useState(false);

  const nights = dates ? daysBetween(dates.start, dates.end) : 0;
  const chosenId = tripForPlace(place.id)?.stayIds[place.id];
  const toggle = (stayId: string) => gate('save-to-trip', () => toggleStay(place, stayId));

  // Prices need at least one night.
  if (!dates || nights < 1) {
    return (
      <Message
        testID="stays-need-dates"
        title="Add dates to see prices"
        body="Stay prices depend on when you go."
        action={{
          label: dates ? 'Add a night' : 'Add dates',
          onPress: () => router.push(routes.dates(place.id)),
        }}
      />
    );
  }

  return (
    <AsyncView state={all}>
      {(stays) =>
        stays.length === 0 ? (
          <Message title={`No stays listed in ${place.name} yet`} />
        ) : (
          <View>
            <FilterBar
              sections={STAY_FILTERS}
              values={filters}
              onChange={setFilters}
              resultCount={visible.length}
            />
            <View style={styles.content}>
              <MapView
                height={196}
                pins={visible.flatMap((stay) =>
                  stay.mapPosition && stay.nightly !== undefined
                    ? [
                        {
                          id: stay.id,
                          label: `${stay.name}, ${formatMoney(stay.nightly)} a night`,
                          text: formatMoney(stay.nightly),
                          position: stay.mapPosition,
                          selected: stay.id === chosenId,
                          onPress: () => toggle(stay.id),
                        },
                      ]
                    : [],
                )}
              />
              <View style={styles.heading}>
                <Text variant="subheading" style={styles.fill}>
                  {pluralize(nights, 'night')} ·{' '}
                  {STAY_SORTS.find((option) => option.value === sort)?.label.toLowerCase()}
                </Text>
                <Button variant="plain" label="Sort" onPress={() => setSorting(true)} />
              </View>
              {visible.length === 0 && (
                <Message
                  title="Nothing matches those filters"
                  action={{ label: 'Clear filters', onPress: () => setFilters({}) }}
                />
              )}
              {visible.map((stay) => (
                <StayRow
                  key={stay.id}
                  stay={stay}
                  nights={nights}
                  chosen={stay.id === chosenId}
                  onToggle={() => toggle(stay.id)}
                  onOpen={() => router.push(routes.stay(stay.id, place.id))}
                />
              ))}
              <Text variant="caption" color="textMuted" style={styles.credit}>
                Stays, scores and prices for {formatRange(dates)} come from LiteAPI, for two
                adults.
              </Text>
            </View>
            <BottomSheet visible={sorting} title="Sort by" onClose={() => setSorting(false)}>
              <ListGroup>
                {STAY_SORTS.map((option) => (
                  <ListRow
                    key={option.value}
                    title={option.label}
                    value={option.value === sort ? 'Selected' : undefined}
                    onPress={() => {
                      setSort(option.value);
                      setSorting(false);
                    }}
                  />
                ))}
              </ListGroup>
            </BottomSheet>
          </View>
        )
      }
    </AsyncView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl },
  heading: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md },
  fill: { flex: 1 },
  credit: { paddingTop: spacing.lg },
});
