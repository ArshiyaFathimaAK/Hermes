import type { Trip, TripItem } from '@/domain/trip';

import { liveItineraryService } from '../live';
import { mockItineraryService } from '../mock';
import { placeDays } from '../rules';

// Same trips and expectations as server/tests/test_itinerary.py, so the two rule sets stay in step.

const DEMO: Trip = {
  id: 'trip-lisbon',
  name: 'Lisbon',
  placeIds: ['lisbon'],
  dates: { start: '2026-12-01', end: '2026-12-05' },
  items: [
    { activityId: 'belem', placeId: 'lisbon', schedule: { day: 0, slot: 'morning' } },
    { activityId: 'lxf', placeId: 'lisbon', schedule: { day: 0, slot: 'afternoon' } },
    { activityId: 'market', placeId: 'lisbon', schedule: { day: 0, slot: 'evening' } },
  ],
  stayIds: {},
};

const unscheduled = (ids: string[], placeId = 'lisbon'): TripItem[] =>
  ids.map((activityId) => ({ activityId, placeId }));

const trip = (days: number, placeIds: string[], items: TripItem[]): Trip => ({
  ...DEMO,
  placeIds,
  dates: { start: '2026-12-01', end: `2026-12-0${days}` },
  items,
});

async function spots(planned: Trip, addSuggestions = true) {
  const plan = await mockItineraryService.generate(planned, { addSuggestions });
  return plan.entries.map((e) => [e.activityId, e.schedule.day, e.schedule.slot, e.suggested]);
}

describe('planning with the simple rules', () => {
  it('suggests one thing a day for the demo trip, best rated first', async () => {
    const plan = await mockItineraryService.generate(DEMO);
    expect(plan.source).toBe('rules');
    expect(await spots(DEMO)).toEqual([
      ['alfama', 1, 'morning', true],
      ['sintra', 2, 'morning', true],
      ['miradouro', 3, 'morning', true],
    ]);
  });

  it('spreads saved things out, in slots that suit them', async () => {
    const planned = trip(3, ['lisbon'], unscheduled(['belem', 'market', 'alfama']));
    expect(await spots(planned, false)).toEqual([
      ['belem', 0, 'morning', false],
      ['market', 1, 'evening', false],
      ['alfama', 2, 'morning', false],
    ]);
  });

  it('splits the days between places in order', async () => {
    const planned = trip(4, ['lisbon', 'kyoto'], [
      ...unscheduled(['belem', 'market']),
      ...unscheduled(['tea'], 'kyoto'),
    ]);
    const plan = await mockItineraryService.generate(planned);
    for (const entry of plan.entries) {
      expect(entry.placeId === 'lisbon').toBe(entry.schedule.day < 2);
    }
  });

  it('only suggests on days with fewer than two things', async () => {
    const planned = trip(2, ['kyoto'], unscheduled(['tea'], 'kyoto'));
    const plan = await mockItineraryService.generate(planned);
    const perDay = [0, 0];
    for (const entry of plan.entries) perDay[entry.schedule.day]++;
    expect(perDay).toEqual([2, 2]);
  });

  it('adds nothing when suggestions are not wanted and everything has a day', async () => {
    expect(await spots(DEMO, false)).toEqual([]);
  });

  it('leaves saved things that no longer exist alone', async () => {
    const planned = trip(2, ['lisbon'], unscheduled(['belem', 'gone']));
    expect((await spots(planned)).map(([id]) => id)).not.toContain('gone');
  });

  it('explains trips it cannot plan', async () => {
    await expect(mockItineraryService.generate({ ...DEMO, dates: undefined })).rejects.toThrow(
      'Pick dates for the trip first.',
    );
    await expect(
      mockItineraryService.generate({ ...DEMO, dates: { start: '2026-12-01', end: '2027-01-15' } }),
    ).rejects.toThrow('Plans can be made for trips of up to 30 days.');
  });

  it('gives every day to a place, even with more places than days', () => {
    expect(placeDays(['lisbon', 'kyoto'], 4)).toEqual(
      new Map([
        ['lisbon', [0, 1]],
        ['kyoto', [2, 3]],
      ]),
    );
    expect(placeDays(['lisbon', 'kyoto', 'lima'], 1)).toEqual(
      new Map([
        ['lisbon', [0]],
        ['kyoto', [0]],
        ['lima', [0]],
      ]),
    );
  });
});

describe('the live service', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sends the trip to the server and returns its plan', async () => {
    const answer = { source: 'ai', entries: [] };
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => answer } as Response);
    expect(await liveItineraryService.generate(DEMO)).toEqual(answer);
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:8000/itinerary/generate');
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({
      placeIds: ['lisbon'],
      dayCount: 5,
      items: DEMO.items,
      addSuggestions: true,
    });
  });

  it("doesn't call the server for a trip without dates", async () => {
    const fetch = jest.spyOn(globalThis, 'fetch');
    await expect(liveItineraryService.generate({ ...DEMO, dates: undefined })).rejects.toThrow(
      'Pick dates for the trip first.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
