import type { DateRange } from '@/domain/dates';
import type { Trip, TripItem, TripSchedule } from '@/domain/trip';

/**
 * The smallest changes that turn one list of trips into another, one per database row.
 * Trip rules (state/trips/trip-logic.ts) work on whole trips; storage only ever receives these.
 * Each maps to one table in supabase/migrations: trips, trip_places, trip_items.
 */
export type TripChange =
  | { type: 'createTrip'; tripId: string; name: string; dates?: DateRange }
  | { type: 'updateTrip'; tripId: string; name: string; dates?: DateRange }
  | { type: 'deleteTrip'; tripId: string }
  | { type: 'addPlace'; tripId: string; placeId: string; position: number }
  | { type: 'removePlace'; tripId: string; placeId: string }
  | { type: 'setStay'; tripId: string; placeId: string; stayId: string | null }
  | {
      type: 'addItem';
      tripId: string;
      activityId: string;
      placeId: string;
      schedule?: TripSchedule;
      sortOrder: number;
    }
  | {
      type: 'updateItem';
      tripId: string;
      activityId: string;
      schedule?: TripSchedule;
      sortOrder: number;
    }
  | { type: 'removeItem'; tripId: string; activityId: string };

const sameDates = (a?: DateRange, b?: DateRange) => a?.start === b?.start && a?.end === b?.end;
const sameSchedule = (a?: TripSchedule, b?: TripSchedule) =>
  a?.day === b?.day && a?.slot === b?.slot;

/**
 * What changed, in an order a database accepts: new trips and places before their items,
 * removed items before their places, and deleted trips last.
 */
export function diffTrips(before: Trip[], after: Trip[]): TripChange[] {
  const old = new Map(before.map((trip) => [trip.id, trip]));
  const kept = new Set(after.map((trip) => trip.id));
  const changes: TripChange[] = [];
  const removals: TripChange[] = [];

  for (const trip of after) {
    const previous = old.get(trip.id);
    if (!previous) {
      changes.push({
        type: 'createTrip',
        tripId: trip.id,
        name: trip.name,
        dates: trip.dates,
      });
    } else if (previous.name !== trip.name || !sameDates(previous.dates, trip.dates)) {
      changes.push({
        type: 'updateTrip',
        tripId: trip.id,
        name: trip.name,
        dates: trip.dates,
      });
    }

    trip.placeIds.forEach((placeId, position) => {
      if (!previous?.placeIds.includes(placeId)) {
        changes.push({ type: 'addPlace', tripId: trip.id, placeId, position });
      }
      const stayId = trip.stayIds[placeId] ?? null;
      if ((previous?.stayIds[placeId] ?? null) !== stayId) {
        changes.push({ type: 'setStay', tripId: trip.id, placeId, stayId });
      }
    });

    // Order within a slot is the order in the list, stored as sortOrder.
    const oldItems = new Map(
      previous?.items.map((item, index) => [item.activityId, { item, index }]),
    );
    trip.items.forEach((item, sortOrder) => {
      const was = oldItems.get(item.activityId);
      if (!was) {
        changes.push({
          type: 'addItem',
          tripId: trip.id,
          activityId: item.activityId,
          placeId: item.placeId,
          schedule: item.schedule,
          sortOrder,
        });
      } else if (!sameSchedule(was.item.schedule, item.schedule) || was.index !== sortOrder) {
        changes.push({
          type: 'updateItem',
          tripId: trip.id,
          activityId: item.activityId,
          schedule: item.schedule,
          sortOrder,
        });
      }
    });

    if (previous) {
      const itemIds = new Set(trip.items.map((item) => item.activityId));
      for (const item of previous.items) {
        if (!itemIds.has(item.activityId)) {
          removals.push({
            type: 'removeItem',
            tripId: trip.id,
            activityId: item.activityId,
          });
        }
      }
      for (const placeId of previous.placeIds) {
        if (!trip.placeIds.includes(placeId)) {
          removals.push({ type: 'removePlace', tripId: trip.id, placeId });
        }
      }
    }
  }

  for (const trip of before) {
    if (!kept.has(trip.id)) removals.push({ type: 'deleteTrip', tripId: trip.id });
  }
  return [
    ...removals.filter((c) => c.type === 'removeItem'),
    ...changes,
    ...removals.filter((c) => c.type !== 'removeItem'),
  ];
}

function updateTrip(trips: Trip[], tripId: string, update: (trip: Trip) => Trip) {
  return trips.map((trip) => (trip.id === tripId ? update(trip) : trip));
}

function setItem(trip: Trip, item: TripItem, sortOrder: number): Trip {
  const items = trip.items.filter((i) => i.activityId !== item.activityId);
  items.splice(Math.min(sortOrder, items.length), 0, item);
  return { ...trip, items };
}

/**
 * Applies changes to a list of trips: what a database does with them.
 * The mock service stores trips with this, so it behaves like the real tables.
 */
export function applyTripChanges(trips: Trip[], changes: TripChange[]): Trip[] {
  return changes.reduce<Trip[]>((current, change) => {
    switch (change.type) {
      case 'createTrip':
        return [
          ...current,
          {
            id: change.tripId,
            name: change.name,
            dates: change.dates,
            placeIds: [],
            items: [],
            stayIds: {},
          },
        ];
      case 'updateTrip':
        return updateTrip(current, change.tripId, (trip) => ({
          ...trip,
          name: change.name,
          dates: change.dates,
        }));
      case 'deleteTrip':
        return current.filter((trip) => trip.id !== change.tripId);
      case 'addPlace':
        return updateTrip(current, change.tripId, (trip) => {
          const placeIds = [...trip.placeIds];
          placeIds.splice(change.position, 0, change.placeId);
          return { ...trip, placeIds };
        });
      case 'removePlace':
        // Like the database: the place's stay and items go with it.
        return updateTrip(current, change.tripId, (trip) => {
          const stayIds = { ...trip.stayIds };
          delete stayIds[change.placeId];
          return {
            ...trip,
            placeIds: trip.placeIds.filter((id) => id !== change.placeId),
            items: trip.items.filter((item) => item.placeId !== change.placeId),
            stayIds,
          };
        });
      case 'setStay':
        return updateTrip(current, change.tripId, (trip) => {
          const stayIds = { ...trip.stayIds };
          if (change.stayId) stayIds[change.placeId] = change.stayId;
          else delete stayIds[change.placeId];
          return { ...trip, stayIds };
        });
      case 'addItem': {
        const { activityId, placeId, schedule, sortOrder } = change;
        return updateTrip(current, change.tripId, (trip) =>
          setItem(trip, { activityId, placeId, schedule }, sortOrder),
        );
      }
      case 'updateItem':
        return updateTrip(current, change.tripId, (trip) => {
          const item = trip.items.find((i) => i.activityId === change.activityId);
          return item
            ? setItem(trip, { ...item, schedule: change.schedule }, change.sortOrder)
            : trip;
        });
      case 'removeItem':
        return updateTrip(current, change.tripId, (trip) => ({
          ...trip,
          items: trip.items.filter((item) => item.activityId !== change.activityId),
        }));
    }
  }, trips);
}
