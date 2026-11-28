import type { Stay } from '@/domain/stay';

import { filterStays } from '../filter-stays';

// UC-05 on live stays, which may be missing a price, score, type or amenities.

const full: Stay = {
  id: 'full',
  name: 'Full',
  kind: 'Hotel',
  score: 9,
  nightly: 90,
  freeCancellation: true,
  amenities: ['Breakfast'],
};
const bare: Stay = { id: 'bare', name: 'Bare' };
const ids = (stays: Stay[]) => stays.map((s) => s.id);

it('keeps stays with missing details when nothing is filtered', () => {
  expect(ids(filterStays([full, bare], {}, 'recommended'))).toEqual(['full', 'bare']);
});

it('leaves out stays missing what a filter asks about', () => {
  expect(ids(filterStays([full, bare], { price: ['100'] }, 'recommended'))).toEqual(['full']);
  expect(ids(filterStays([full, bare], { score: ['8'] }, 'recommended'))).toEqual(['full']);
  expect(ids(filterStays([full, bare], { kind: ['Hotel'] }, 'recommended'))).toEqual(['full']);
  expect(
    ids(filterStays([full, bare], { amenities: ['Free cancellation'] }, 'recommended')),
  ).toEqual(['full']);
  expect(ids(filterStays([full, bare], { amenities: ['Breakfast'] }, 'recommended'))).toEqual([
    'full',
  ]);
});

it('sorts stays missing the value last', () => {
  expect(ids(filterStays([bare, full], {}, 'price'))).toEqual(['full', 'bare']);
  expect(ids(filterStays([bare, full], {}, 'score'))).toEqual(['full', 'bare']);
});
