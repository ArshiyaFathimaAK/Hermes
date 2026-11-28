import type { DateRange, IsoDate } from '@/domain/dates';
import type { Trip, TripItem, TripSchedule } from '@/domain/trip';
import { daysBetween } from '@/utils/dates';

// Pure functions: trips in, new trips out. No React, so they are easy to unit test.

export interface PlaceRef {
  id: string;
  name: string;
}

/** Soonest first, then trips without dates, then trips that are over. */
export function sortTrips(trips: Trip[], now: IsoDate): Trip[] {
  const group = ({ dates }: Trip) => (!dates ? 1 : dates.end >= now ? 0 : 2);
  return [...trips].sort(
    (a, b) => group(a) - group(b) || (a.dates?.start ?? '').localeCompare(b.dates?.start ?? ''),
  );
}

/**
 * The trip that saves for a place go to. Several trips may include the same place,
 * so the one the person is working on wins.
 */
export const findTripForPlace = (trips: Trip[], placeId: string, activeTripId?: string) =>
  trips.find((trip) => trip.id === activeTripId && trip.placeIds.includes(placeId)) ??
  trips.find((trip) => trip.placeIds.includes(placeId));

export const isActivitySaved = (trip: Trip | undefined, activityId: string) =>
  trip?.items.some((item) => item.activityId === activityId) ?? false;

/** "Lisbon", then "Lisbon 2", "Lisbon 3". Ids follow the same pattern. */
function firstUnused(taken: string[], base: string, separator: string) {
  let candidate = base;
  for (let n = 2; taken.includes(candidate); n++) candidate = `${base}${separator}${n}`;
  return candidate;
}

/** Makes the id for a new trip. Storage can supply one (the database needs UUIDs). */
export type NewTripId = () => string;

/** Always adds a trip, even when another one already includes the place. */
export function createTrip(
  trips: Trip[],
  place: PlaceRef,
  dates?: DateRange,
  newId?: NewTripId,
): Trip[] {
  const trip: Trip = {
    id: newId?.() ?? firstUnused(trips.map((t) => t.id), `trip-${place.id}`, '-'),
    name: firstUnused(trips.map((t) => t.name), place.name, ' '),
    placeIds: [place.id],
    dates,
    items: [],
    stayIds: {},
  };
  return [...trips, trip];
}

function updateTrip(trips: Trip[], tripId: string, update: (trip: Trip) => Trip) {
  return trips.map((trip) => (trip.id === tripId ? update(trip) : trip));
}

/** The first save for a place creates its trip; people can also start one with createTrip. */
export function ensureTrip(
  trips: Trip[],
  place: PlaceRef,
  dates?: DateRange,
  newId?: NewTripId,
): Trip[] {
  return findTripForPlace(trips, place.id) ? trips : createTrip(trips, place, dates, newId);
}

export function toggleActivity(
  trips: Trip[],
  place: PlaceRef,
  activityId: string,
  dates?: DateRange,
  activeTripId?: string,
  newId?: NewTripId,
): Trip[] {
  const next = ensureTrip(trips, place, dates, newId);
  const target = findTripForPlace(next, place.id, activeTripId)!;
  if (isActivitySaved(target, activityId)) return removeItem(next, target.id, activityId);
  return updateTrip(next, target.id, (trip) => ({
    ...trip,
    items: [...trip.items, { activityId, placeId: place.id }],
  }));
}

/** Choosing the same stay again removes it. */
export function toggleStay(
  trips: Trip[],
  place: PlaceRef,
  stayId: string,
  dates?: DateRange,
  activeTripId?: string,
  newId?: NewTripId,
): Trip[] {
  const next = ensureTrip(trips, place, dates, newId);
  const target = findTripForPlace(next, place.id, activeTripId)!;
  return updateTrip(next, target.id, (trip) => {
    const stayIds = { ...trip.stayIds };
    if (stayIds[place.id] === stayId) delete stayIds[place.id];
    else stayIds[place.id] = stayId;
    return { ...trip, stayIds };
  });
}

export function removeItem(trips: Trip[], tripId: string, activityId: string) {
  return updateTrip(trips, tripId, (trip) => ({
    ...trip,
    items: trip.items.filter((item) => item.activityId !== activityId),
  }));
}

export const deleteTrip = (trips: Trip[], tripId: string) =>
  trips.filter((trip) => trip.id !== tripId);

export function addPlace(trips: Trip[], tripId: string, placeId: string) {
  return updateTrip(trips, tripId, (trip) =>
    trip.placeIds.includes(placeId) ? trip : { ...trip, placeIds: [...trip.placeIds, placeId] },
  );
}

/** Things on days that no longer exist go back to "not scheduled". */
export function setDates(trips: Trip[], tripId: string, dates: DateRange) {
  const lastDay = daysBetween(dates.start, dates.end);
  return updateTrip(trips, tripId, (trip) => ({
    ...trip,
    dates,
    items: trip.items.map((item) =>
      item.schedule && item.schedule.day > lastDay ? { ...item, schedule: undefined } : item,
    ),
  }));
}

/** Moving to a slot puts the item at the end of it. */
export function scheduleItem(
  trips: Trip[],
  tripId: string,
  activityId: string,
  schedule?: TripSchedule,
) {
  return updateTrip(trips, tripId, (trip) => {
    const item = trip.items.find((i) => i.activityId === activityId);
    if (!item) return trip;
    const others = trip.items.filter((i) => i !== item);
    return { ...trip, items: [...others, { ...item, schedule }] };
  });
}

/** One line of a generated plan (Generate AI Itinerary). */
export interface PlannedItem {
  activityId: string;
  placeId: string;
  schedule: TripSchedule;
  /** True for something that isn't in the trip yet. */
  suggested: boolean;
}

/**
 * Puts a generated plan into a trip, in one change: saved things move to their day and slot, and
 * suggestions are added. Lines that no longer fit are skipped: a saved thing removed while the plan
 * was being made, a suggestion that has been saved since, or a place no longer in the trip.
 */
export function applyPlan(trips: Trip[], tripId: string, plan: PlannedItem[]) {
  return updateTrip(trips, tripId, (trip) => {
    const inTrip = new Set(trip.items.map((item) => item.activityId));
    const fits = plan.filter(
      (line) =>
        trip.placeIds.includes(line.placeId) && inTrip.has(line.activityId) !== line.suggested,
    );
    const planned = new Set(fits.map((line) => line.activityId));
    return {
      ...trip,
      items: [
        ...trip.items.filter((item) => !planned.has(item.activityId)),
        ...fits.map(({ activityId, placeId, schedule }) => ({ activityId, placeId, schedule })),
      ],
    };
  });
}

const sameSlot = (a: TripItem, b: TripItem) =>
  a.schedule?.day === b.schedule?.day && a.schedule?.slot === b.schedule?.slot;

/** Swaps an item with its neighbor in the same slot. */
export function moveItem(trips: Trip[], tripId: string, activityId: string, by: -1 | 1) {
  return updateTrip(trips, tripId, (trip) => {
    const items = [...trip.items];
    const from = items.findIndex((i) => i.activityId === activityId);
    if (from < 0) return trip;
    let to = from + by;
    while (items[to] && !sameSlot(items[to], items[from])) to += by;
    if (!items[to]) return trip;
    [items[from], items[to]] = [items[to], items[from]];
    return { ...trip, items };
  });
}
