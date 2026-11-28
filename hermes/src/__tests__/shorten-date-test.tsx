import type { Trip } from '@/domain/trip';
import { unscheduledItems } from '@/features/trips/plan';
import { setDates } from '@/state/trips/trip-logic';

// UC-10 Manage Trips, TC-10-02. Pure logic: no screens.

it('TC-10-02: shortening the dates takes items off days that no longer exist', () => {
  const lisbon: Trip = {
    id: 'trip-lisbon',
    name: 'Lisbon',
    placeIds: ['lisbon'],
    dates: { start: '2026-11-27', end: '2026-12-01' }, // 5 days: day 0 to day 4
    items: [
      { activityId: 'lxf', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
      { activityId: 'belem', placeId: 'lisbon', schedule: { day: 4, slot: 'morning' } },
    ],
    stayIds: {},
  };
  const kyoto: Trip = {
    id: 'trip-kyoto',
    name: 'Kyoto',
    placeIds: ['kyoto'],
    dates: { start: '2026-11-27', end: '2026-12-01' },
    items: [{ activityId: 'tea', placeId: 'kyoto', schedule: { day: 4, slot: 'evening' } }],
    stayIds: {},
  };
  const shorter = { start: '2026-11-27', end: '2026-11-28' } as const; // now only day 0 and day 1

  const [updatedLisbon, untouchedKyoto] = setDates([lisbon, kyoto], 'trip-lisbon', shorter);

  expect(updatedLisbon.dates).toEqual(shorter);
  // Nothing is deleted; the item on the removed day goes back to "not scheduled".
  expect(updatedLisbon.items).toHaveLength(2);
  expect(updatedLisbon.items.find((i) => i.activityId === 'belem')?.schedule).toBeUndefined();
  expect(unscheduledItems(updatedLisbon.items).map((i) => i.activityId)).toEqual(['belem']);
  // The item on a day that still exists stays where it was.
  expect(updatedLisbon.items.find((i) => i.activityId === 'lxf')?.schedule).toEqual({
    day: 0,
    slot: 'morning',
  });
  // Other trips are not affected.
  expect(untouchedKyoto).toEqual(kyoto);
});
