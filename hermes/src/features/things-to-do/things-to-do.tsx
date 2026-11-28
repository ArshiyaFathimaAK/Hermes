import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Place } from '@/domain/place';
import { routes } from '@/navigation/routes';
import { useAccountGate } from '@/state/session';
import { useTrips } from '@/state/trips';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { FilterBar } from '@/ui/filter-bar';
import { Message } from '@/ui/message';
import { Text } from '@/ui/text';

import { ActivityCard } from './activity-card';
import { ACTIVITY_FILTERS, QUICK_FILTERS, type QuickFilter } from './filter-activities';
import { useThingsToDo } from './use-things-to-do';

export function ThingsToDo({ place }: { place: Place }) {
  const { all, visible, quick, setQuick, filters, setFilters, clearFilters } = useThingsToDo(
    place.id,
  );
  const { isSaved, toggleActivity } = useTrips();
  const gate = useAccountGate();

  return (
    <AsyncView state={all}>
      {(activities) =>
        activities.length === 0 ? (
          <Message
            title={`Nothing listed in ${place.name} yet`}
            body="Try another place for now."
          />
        ) : (
          <View>
            <FilterBar
              quick={{
                options: QUICK_FILTERS,
                value: quick,
                onChange: (value) => setQuick(value as QuickFilter),
              }}
              sections={ACTIVITY_FILTERS}
              values={filters}
              onChange={setFilters}
              resultCount={visible.length}
            />
            <View style={styles.list}>
              <Text variant="caption" color="textMuted">
                Places from Google · Tours from Viator · Times from city center
              </Text>
              {visible.length === 0 && (
                <Message
                  testID="no-filter-results"
                  title="Nothing matches those filters"
                  action={{ label: 'Clear filters', onPress: clearFilters }}
                />
              )}
              {visible.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  saved={isSaved(place.id, activity.id)}
                  onPress={() => router.push(routes.activity(activity.id))}
                  onToggleSaved={() =>
                    gate('save-to-trip', () => toggleActivity(place, activity.id))
                  }
                />
              ))}
            </View>
          </View>
        )
      }
    </AsyncView>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg, paddingHorizontal: spacing.xl },
});
