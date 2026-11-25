import type { Trip } from '@/domain/trip';
import { addDays, today } from '@/utils/dates';

import type { TripService } from './contract';

/** Kept in memory: closing the app resets it. */
const saved = new Map<string, Trip[]>();

/** Back to the sample trip. Tests call this before each test (jest.setup.ts). */
export function resetMockTrips() {
  saved.clear();
  saved.set('demo-user', sampleTrips());
}

function sampleTrips(): Trip[] {
  return [
    {
      id: 'trip-lisbon',
      name: 'Lisbon',
      placeIds: ['lisbon'],
      dates: { start: addDays(today(), 9), end: addDays(today(), 13) },
      items: [
        { activityId: 'belem', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
        { activityId: 'lxf', placeId: 'lisbon', schedule: { day: 0, slot: 'afternoon' } },
        { activityId: 'market', placeId: 'lisbon', schedule: { day: 0, slot: 'evening' } },
      ],
      stayIds: {},
    },
  ];
}

resetMockTrips();

export const mockTripService: TripService = {
  async load(userId) {
    return saved.get(userId) ?? [];
  },
  async save(userId, trips) {
    saved.set(userId, trips);
  },
};
