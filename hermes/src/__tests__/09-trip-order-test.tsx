import type { Trip } from '@/domain/trip';
import { sortTrips } from '@/state/trips/trip-logic';

// UC-09 View Saved Trips, TC-09-02. Pure logic: no screens.

const trip = (id: string, dates?: Trip['dates']): Trip => ({
  id,
  name: id,
  placeIds: [id],
  dates,
  items: [],
  stayIds: {},
});

it('TC-09-02: lists upcoming trips first, then trips without dates, then past trips', () => {
  const now = '2026-11-27';
  const trips = [
    trip('lisbon', { start: '2026-12-06', end: '2026-12-10' }),
    trip('kyoto'),
    trip('paris', { start: '2026-10-01', end: '2026-10-05' }),
    trip('rome', { start: '2026-11-30', end: '2026-12-02' }),
  ];

  expect(sortTrips(trips, now).map((t) => t.id)).toEqual(['rome', 'lisbon', 'kyoto', 'paris']);
  // Sorting returns a new list and leaves the saved order alone.
  expect(trips.map((t) => t.id)).toEqual(['lisbon', 'kyoto', 'paris', 'rome']);
});
