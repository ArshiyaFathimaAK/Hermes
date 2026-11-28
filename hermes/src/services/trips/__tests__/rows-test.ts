import { tripFromRows, type TripWithRows } from '../rows';

const row: TripWithRows = {
  id: 't1',
  name: 'Lisbon',
  start_date: '2026-12-03',
  end_date: '2026-12-07',
  trip_places: [
    { place_id: 'kyoto', position: 1, stay_id: null, created_at: '2026-11-02T00:00:00Z' },
    { place_id: 'lisbon', position: 0, stay_id: 'river', created_at: '2026-11-01T00:00:00Z' },
  ],
  trip_items: [
    {
      activity_id: 'lxf',
      place_id: 'lisbon',
      day: 0,
      slot: 'morning',
      sort_order: 2,
      created_at: '2026-11-01T00:00:00Z',
    },
    {
      activity_id: 'belem',
      place_id: 'lisbon',
      day: 0,
      slot: 'morning',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00Z',
    },
    {
      activity_id: 'market',
      place_id: 'lisbon',
      day: null,
      slot: null,
      sort_order: 3,
      created_at: '2026-11-01T00:00:00Z',
    },
  ],
};

it('turns database rows into a trip, in order', () => {
  expect(tripFromRows(row)).toEqual({
    id: 't1',
    name: 'Lisbon',
    dates: { start: '2026-12-03', end: '2026-12-07' },
    placeIds: ['lisbon', 'kyoto'],
    stayIds: { lisbon: 'river' },
    items: [
      { activityId: 'belem', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
      { activityId: 'lxf', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
      { activityId: 'market', placeId: 'lisbon', schedule: undefined },
    ],
  });
});

it('leaves out dates when the trip has none', () => {
  expect(tripFromRows({ ...row, start_date: null, end_date: null }).dates).toBeUndefined();
});

it("treats a time of day the app doesn't know as not on a day, instead of crashing", () => {
  const item = { ...row.trip_items[0], slot: 'night' };
  expect(tripFromRows({ ...row, trip_items: [item] }).items[0].schedule).toBeUndefined();
});
