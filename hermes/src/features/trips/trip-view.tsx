import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { useDailyWeather } from '@/features/weather';
import { routes } from '@/navigation/routes';
import { useTrips } from '@/state/trips';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Button } from '@/ui/button';
import { IconButton } from '@/ui/icon-button';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Message } from '@/ui/message';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';
import { daysBetween, eachDay, formatCountdown, formatRange, today } from '@/utils/dates';

import { CostCard } from './components/cost-card';
import { DayPlan } from './components/day-plan';
import { DayTabs } from './components/day-tabs';
import { DeleteTrip } from './components/delete-trip';
import { ScheduleSheet } from './components/schedule-sheet';
import { ShareSheet } from './components/share-sheet';
import { StayBanner } from './components/stay-banner';
import { TripPlaces } from './components/trip-places';
import { unscheduledItems } from './plan';
import { useShareTrip } from './use-share-trip';
import { useTripDetails } from './use-trip-details';

/** Opens on today while traveling, otherwise on the first day. */
function initialDay(trip: Trip) {
  if (!trip.dates) return 0;
  const day = daysBetween(trip.dates.start, today());
  return day >= 0 && day <= daysBetween(trip.dates.start, trip.dates.end) ? day : 0;
}

export function TripView({ trip }: { trip: Trip }) {
  const { saveError } = useTrips();
  const details = useTripDetails(trip);
  const weather = useDailyWeather(trip.placeIds[0], trip.dates);
  const share = useShareTrip(trip);
  const [pickedDay, setDay] = useState(() => initialDay(trip));
  const [editingId, setEditingId] = useState<string>();

  const days = trip.dates ? eachDay(trip.dates) : [];
  const day = Math.min(pickedDay, Math.max(days.length - 1, 0));
  const daily = weather.status === 'ready' ? weather.data : [];
  const unscheduled = unscheduledItems(trip.items);
  const editing = trip.items.find((item) => item.activityId === editingId);
  const placeId = trip.placeIds[0];
  const addThings = () => router.push(routes.place(placeId));

  return (
    <>
      <View style={styles.header}>
        <View style={styles.fill}>
          <Text variant="title" accessibilityRole="header">
            {trip.name}
          </Text>
          <Text color="textMuted">
            {trip.dates
              ? `${formatRange(trip.dates)} · ${formatCountdown(trip.dates.start)}`
              : 'No dates yet'}
          </Text>
        </View>
        <IconButton
          testID="share-trip"
          icon="share"
          label="Share trip"
          onPress={share.createLink}
        />
        <IconButton
          icon="add"
          variant="primary"
          label={`Add things to do in ${trip.name}`}
          onPress={addThings}
        />
      </View>
      {(saveError ?? share.error) && <Text color="danger">{saveError ?? share.error}</Text>}

      <AsyncView state={details}>
        {({ places, activities, stays }) => (
          <>
            <TripPlaces
              places={places}
              onOpen={(id) => router.push(routes.place(id))}
              onAdd={() => router.push(routes.addPlace(trip.id))}
            />
            <View style={styles.banners}>
              {places.map((place) => (
                <StayBanner
                  key={place.id}
                  place={place}
                  stay={stays.find((stay) => stay.id === trip.stayIds[place.id])}
                  showPlace={places.length > 1}
                  onPress={() => router.push(routes.place(place.id, 'stays'))}
                />
              ))}
            </View>
            {days.length > 0 ? (
              <>
                <DayTabs days={days} weather={daily} selected={day} onSelect={setDay} />
                <DayPlan
                  day={day}
                  date={days[day]}
                  items={trip.items}
                  activities={activities}
                  weather={daily[day]}
                  onPressItem={(item) => setEditingId(item.activityId)}
                  onAdd={addThings}
                />
              </>
            ) : (
              <Button
                variant="soft"
                icon="calendar"
                label="Add dates to plan by day"
                onPress={() => router.push(routes.dates(placeId))}
              />
            )}

            {unscheduled.length > 0 && (
              <Section title="Saved, not on a day yet" tone="strong">
                <ListGroup>
                  {unscheduled.map((item) => (
                    <ListRow
                      key={item.activityId}
                      testID={`unscheduled-${item.activityId}`}
                      title={activities.get(item.activityId)?.name ?? 'No longer available'}
                      subtitle={activities.get(item.activityId)?.type}
                      onPress={() => setEditingId(item.activityId)}
                    />
                  ))}
                </ListGroup>
              </Section>
            )}
            {trip.items.length === 0 && (
              <Message
                title="Nothing saved yet"
                action={{ label: 'Find things to do', onPress: addThings }}
              />
            )}
            {(trip.items.length > 0 || stays.length > 0) && <CostCard trip={trip} />}
            <DeleteTrip trip={trip} />

            {editing && (
              <ScheduleSheet
                trip={trip}
                item={editing}
                name={activities.get(editing.activityId)?.name ?? 'No longer available'}
                days={days}
                onClose={() => setEditingId(undefined)}
              />
            )}
          </>
        )}
      </AsyncView>

      {share.link && (
        <ShareSheet
          link={share.link}
          error={share.error}
          onSend={share.send}
          onClose={share.close}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  fill: { flex: 1 },
  banners: { gap: spacing.sm },
});
