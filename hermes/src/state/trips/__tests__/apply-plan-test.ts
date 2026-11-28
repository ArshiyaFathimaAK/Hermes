import type { Trip } from '@/domain/trip';
import { applyTripChanges, diffTrips } from '@/services/trips/changes';

import { applyPlan, type PlannedItem } from '../trip-logic';

// Generate AI Itinerary: putting a plan into a trip.

const lisbonTrip: Trip = {
  id: 'trip-lisbon',
  name: 'Lisbon',
  placeIds: ['lisbon'],
  dates: { start: '2026-12-01', end: '2026-12-03' },
  items: [
    { activityId: 'belem', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
    { activityId: 'market', placeId: 'lisbon' },
  ],
  stayIds: {},
};

const line = (
  activityId: string,
  day: number,
  slot: 'morning' | 'afternoon' | 'evening',
  suggested: boolean,
  placeId = 'lisbon',
): PlannedItem => ({ activityId, placeId, schedule: { day, slot }, suggested });

describe('applying a plan', () => {
  it('puts saved things on their day and adds suggestions', () => {
    const [trip] = applyPlan([lisbonTrip], 'trip-lisbon', [
      line('market', 1, 'evening', false),
      line('alfama', 2, 'morning', true),
    ]);
    expect(trip.items).toEqual([
      { activityId: 'belem', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
      { activityId: 'market', placeId: 'lisbon', schedule: { day: 1, slot: 'evening' } },
      { activityId: 'alfama', placeId: 'lisbon', schedule: { day: 2, slot: 'morning' } },
    ]);
  });

  it('skips lines that no longer fit the trip', () => {
    const [trip] = applyPlan([lisbonTrip], 'trip-lisbon', [
      line('sintra', 1, 'morning', false), // saved when planned, removed since
      line('belem', 2, 'morning', true), // suggested, but saved since
      line('tea', 1, 'evening', true, 'kyoto'), // a place that isn't in the trip
    ]);
    expect(trip).toEqual(lisbonTrip);
  });

  it('leaves other trips alone', () => {
    const other = { ...lisbonTrip, id: 'trip-other' };
    const [, untouched] = applyPlan([lisbonTrip, other], 'trip-lisbon', [
      line('market', 1, 'evening', false),
    ]);
    expect(untouched).toBe(other);
  });

  it('saves as ordinary changes, so stored trips match the screen', () => {
    const before = [lisbonTrip];
    const after = applyPlan(before, 'trip-lisbon', [
      line('market', 1, 'evening', false),
      line('alfama', 2, 'morning', true),
      line('miradouro', 2, 'afternoon', true),
    ]);
    expect(applyTripChanges(before, diffTrips(before, after))).toEqual(after);
  });
});
