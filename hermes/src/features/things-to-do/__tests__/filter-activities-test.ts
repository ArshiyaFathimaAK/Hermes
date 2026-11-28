import { activityService } from '@/services/activities';

import { filterActivities } from '../filter-activities';

const ids = async (...args: [Parameters<typeof filterActivities>[1], Parameters<typeof filterActivities>[2]]) =>
  filterActivities(await activityService.list('lisbon'), ...args).map((a) => a.id);

describe('filterActivities', () => {
  it('returns everything without filters', async () => {
    expect(await ids('all', {})).toHaveLength(6);
  });

  it('filters by category', async () => {
    expect(await ids('tours', {})).toEqual(['alfama', 'sintra']);
  });

  it('combines sections with AND', async () => {
    expect(await ids('all', { rating: ['4.5'], availability: ['open'] })).toEqual([
      'belem',
      'lxf',
      'miradouro',
    ]);
  });

  it('leaves out unknown prices when a price is chosen', async () => {
    expect(await ids('all', { price: ['2'] })).toEqual(['alfama', 'market']);
  });
});
