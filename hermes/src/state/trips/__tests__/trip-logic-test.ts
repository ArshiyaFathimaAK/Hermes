import * as logic from '../trip-logic';

const lisbon = { id: 'lisbon', name: 'Lisbon' };

describe('trip logic', () => {
  it('creates a trip on the first save, with the dates already picked', () => {
    const dates = { start: '2026-11-27', end: '2026-12-01' };
    const [trip] = logic.toggleActivity([], lisbon, 'belem', dates);
    expect(trip).toMatchObject({ name: 'Lisbon', placeIds: ['lisbon'], dates });
    expect(trip.items).toEqual([{ activityId: 'belem', placeId: 'lisbon' }]);
  });

  it('removes an activity when toggled again', () => {
    const saved = logic.toggleActivity([], lisbon, 'belem');
    expect(logic.toggleActivity(saved, lisbon, 'belem')[0].items).toEqual([]);
  });

  it('saves into the trip that holds the place', () => {
    const kyoto = { id: 'kyoto', name: 'Kyoto' };
    const trips = logic.addPlace(logic.ensureTrip([], lisbon), 'trip-lisbon', 'kyoto');
    const next = logic.toggleActivity(trips, kyoto, 'temple');
    expect(next).toHaveLength(1);
    expect(next[0].items[0].placeId).toBe('kyoto');
  });

  it('reorders within a slot only', () => {
    let trips = ['a', 'b', 'c'].reduce((t, id) => logic.toggleActivity(t, lisbon, id), logic.ensureTrip([], lisbon));
    trips = logic.scheduleItem(trips, 'trip-lisbon', 'a', { day: 0, slot: 'morning' });
    trips = logic.scheduleItem(trips, 'trip-lisbon', 'b', { day: 0, slot: 'evening' });
    trips = logic.scheduleItem(trips, 'trip-lisbon', 'c', { day: 0, slot: 'morning' });
    trips = logic.moveItem(trips, 'trip-lisbon', 'c', -1);
    expect(trips[0].items.map((i) => i.activityId)).toEqual(['c', 'b', 'a']);
  });

  it('unschedules things on days that no longer exist', () => {
    let trips = logic.toggleActivity([], lisbon, 'belem');
    trips = logic.scheduleItem(trips, 'trip-lisbon', 'belem', { day: 4, slot: 'morning' });
    trips = logic.setDates(trips, 'trip-lisbon', { start: '2026-11-27', end: '2026-11-28' });
    expect(trips[0].items[0].schedule).toBeUndefined();
  });

  it('saves to the active trip when two include the place', () => {
    const trips = logic.createTrip(logic.createTrip([], lisbon), lisbon);
    expect(trips.map((t) => [t.id, t.name])).toEqual([
      ['trip-lisbon', 'Lisbon'],
      ['trip-lisbon-2', 'Lisbon 2'],
    ]);
    const next = logic.toggleActivity(trips, lisbon, 'belem', undefined, 'trip-lisbon-2');
    expect(next.map((t) => t.items.length)).toEqual([0, 1]);
  });
});
