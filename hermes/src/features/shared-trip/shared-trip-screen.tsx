import { StyleSheet, View } from 'react-native';

import { DayPlan, StayBanner, useTripDetails } from '@/features/trips';
import { useDailyWeather } from '@/features/weather';
import { goBack } from '@/navigation/routes';
import type { SharedTrip } from '@/services/sharing/contract';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { IconButton } from '@/ui/icon-button';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Screen } from '@/ui/screen';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';
import { eachDay, formatRange } from '@/utils/dates';

import { useSharedTrip } from './use-shared-trip';

export function SharedTripScreen({ token }: { token: string }) {
  const trip = useSharedTrip(token);
  return (
    <Screen testID="shared-trip-screen">
      <IconButton icon="back" label="Back" onPress={goBack} style={styles.back} />
      <AsyncView state={trip}>{(loaded) => <SharedTripView trip={loaded} />}</AsyncView>
    </Screen>
  );
}

function SharedTripView({ trip }: { trip: SharedTrip }) {
  const details = useTripDetails(trip);
  const weather = useDailyWeather(trip.placeIds[0], trip.dates);
  const days = trip.dates ? eachDay(trip.dates) : [];
  const unscheduled = trip.items.filter((item) => !item.schedule);

  return (
    <>
      <View>
        <Text variant="title" accessibilityRole="header">
          {trip.name}
        </Text>
        <Text color="textMuted">
          {trip.dates ? `${formatRange(trip.dates)} · ` : ''}Shared with you · view only
        </Text>
      </View>
      <AsyncView state={details}>
        {({ places, activities, stays }) => (
          <>
            {places.map((place) => (
              <StayBanner
                key={place.id}
                place={place}
                stay={stays.find((stay) => stay.id === trip.stayIds[place.id])}
                showPlace={places.length > 1}
              />
            ))}
            {days.map((date, day) => (
              <DayPlan
                key={date}
                day={day}
                date={date}
                items={trip.items}
                activities={activities}
                weather={weather.status === 'ready' ? weather.data[day] : undefined}
              />
            ))}
            {unscheduled.length > 0 && (
              <Section title="Saved" tone="strong">
                <ListGroup>
                  {unscheduled.map((item) => (
                    <ListRow
                      key={item.activityId}
                      title={activities.get(item.activityId)?.name ?? 'No longer available'}
                    />
                  ))}
                </ListGroup>
              </Section>
            )}
          </>
        )}
      </AsyncView>
    </>
  );
}

const styles = StyleSheet.create({ back: { marginLeft: -spacing.md } });
