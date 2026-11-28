import type { Trip } from '@/domain/trip';

import * as logic from '@/state/trips/trip-logic';

import { applyTripChanges, diffTrips } from '../changes';

const lisbon = { id: 'lisbon', name: 'Lisbon' };
const kyoto = { id: 'kyoto', name: 'Kyoto' };
const ACTIVITIES = ['belem', 'lxf', 'market', 'alfama', 'sintra'];
const SLOTS = ['morning', 'afternoon', 'evening'] as const;

// Small, repeatable random numbers, so a failure can be replayed.
function random(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

/** One of the things people can do to their trips, picked at random. */
function randomStep(trips: Trip[], next: () => number): Trip[] {
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)];
  const trip = trips.length > 0 ? pick(trips) : undefined;
  const item = trip && trip.items.length > 0 ? pick(trip.items) : undefined;
  switch (Math.floor(next() * 9)) {
    case 0:
      return logic.createTrip(trips, pick([lisbon, kyoto]));
    case 1:
      return logic.toggleActivity(trips, lisbon, pick(ACTIVITIES), undefined, trip?.id);
    case 2:
      return logic.toggleStay(trips, lisbon, pick(['river', 'chiado']), undefined, trip?.id);
    case 3:
      return trip ? logic.addPlace(trips, trip.id, 'kyoto') : trips;
    case 4:
      return trip
        ? logic.setDates(trips, trip.id, {
            start: '2026-12-03',
            end: pick(['2026-12-04', '2026-12-08']),
          })
        : trips;
    case 5:
      return trip && item
        ? logic.scheduleItem(trips, trip.id, item.activityId, {
            day: pick([0, 1, 2]),
            slot: pick(SLOTS),
          })
        : trips;
    case 6:
      return trip && item
        ? logic.moveItem(trips, trip.id, item.activityId, pick([-1, 1] as const))
        : trips;
    case 7:
      return trip && item ? logic.removeItem(trips, trip.id, item.activityId) : trips;
    default:
      return trip && next() < 0.3 ? logic.deleteTrip(trips, trip.id) : trips;
  }
}

describe('storing only what changed', () => {
  it.each(Array.from({ length: 40 }, (_, seed) => seed + 1))(
    'rebuilds exactly the same trips (run %i)',
    (seed) => {
      const next = random(seed);
      let screen: Trip[] = [];
      let stored: Trip[] = [];
      for (let step = 0; step < 60; step++) {
        const after = randomStep(screen, next);
        stored = applyTripChanges(stored, diffTrips(screen, after));
        screen = after;
        expect(stored).toEqual(screen);
      }
    },
  );

  it('sends nothing when nothing changed', () => {
    const trips = logic.toggleActivity([], lisbon, 'belem');
    expect(diffTrips(trips, trips)).toEqual([]);
  });

  it('saves one item as one change', () => {
    const before = logic.toggleActivity([], lisbon, 'belem');
    const after = logic.toggleActivity(before, lisbon, 'lxf');
    expect(diffTrips(before, after)).toEqual([
      {
        type: 'addItem',
        tripId: 'trip-lisbon',
        activityId: 'lxf',
        placeId: 'lisbon',
        sortOrder: 1,
      },
    ]);
  });

  it('creates a trip before its place, and its place before its items', () => {
    const types = diffTrips([], logic.toggleActivity([], lisbon, 'belem')).map((c) => c.type);
    expect(types).toEqual(['createTrip', 'addPlace', 'addItem']);
  });

  it('uses the id storage gives it', () => {
    const [trip] = logic.createTrip([], lisbon, undefined, () => 'a1b2');
    expect(trip.id).toBe('a1b2');
  });
});
