import type { Stay } from '@/domain/stay';
import type { FilterSection, FilterValues } from '@/ui/filter-sheet';

// UC-05 Filter Search Results, for lodging.

export type StaySort = 'recommended' | 'price' | 'score';

export const STAY_SORTS: { value: StaySort; label: string }[] = [
  { value: 'recommended', label: 'Closest to saves' },
  { value: 'price', label: 'Lowest price' },
  { value: 'score', label: 'Top rated' },
];

export const STAY_FILTERS: FilterSection[] = [
  {
    id: 'price',
    title: 'Price per night',
    options: [
      { value: '100', label: 'Up to $100' },
      { value: '150', label: 'Up to $150' },
      { value: '200', label: 'Up to $200' },
    ],
  },
  {
    id: 'score',
    title: 'Guest score',
    options: [
      { value: '8', label: '8+' },
      { value: '9', label: '9+' },
    ],
  },
  {
    id: 'kind',
    title: 'Type',
    multiple: true,
    advanced: true,
    options: ['Hotel', 'Apartment', 'Guesthouse'].map((value) => ({ value, label: value })),
  },
  {
    id: 'amenities',
    title: 'Amenities',
    multiple: true,
    advanced: true,
    options: ['Free cancellation', 'Breakfast', 'Kitchen', 'Pool'].map((value) => ({
      value,
      label: value,
    })),
  },
];

export function filterStays(stays: Stay[], values: FilterValues, sort: StaySort): Stay[] {
  const { price = [], score = [], kind = [], amenities = [] } = values;
  const matches = stays.filter((stay) => {
    if (price.length > 0 && stay.nightly > Number(price[0])) return false;
    if (score.length > 0 && stay.score < Number(score[0])) return false;
    if (kind.length > 0 && !kind.includes(stay.kind)) return false;
    return amenities.every((amenity) =>
      amenity === 'Free cancellation' ? stay.freeCancellation : stay.amenities.includes(amenity),
    );
  });
  if (sort === 'price') matches.sort((a, b) => a.nightly - b.nightly);
  if (sort === 'score') matches.sort((a, b) => b.score - a.score);
  return matches;
}
