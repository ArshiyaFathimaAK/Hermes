import type { Activity, ActivityCategory } from '@/domain/activity';
import type { FilterSection, FilterValues } from '@/ui/filter-sheet';

// UC-05 Filter Search Results.

export type QuickFilter = 'all' | ActivityCategory;

export const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sights', label: 'Sights' },
  { value: 'food', label: 'Food' },
  { value: 'tours', label: 'Tours' },
];

/** Adding an option here is all the UI needs. Mark rare ones `advanced`. */
export const ACTIVITY_FILTERS: FilterSection[] = [
  {
    id: 'price',
    title: 'Price',
    multiple: true,
    options: [
      { value: '0', label: 'Free' },
      { value: '1', label: '$' },
      { value: '2', label: '$$' },
      { value: '3', label: '$$$' },
      { value: '4', label: '$$$$' },
    ],
  },
  {
    id: 'rating',
    title: 'Rating',
    options: [
      { value: '4', label: '4.0+' },
      { value: '4.5', label: '4.5+' },
    ],
  },
  {
    id: 'availability',
    title: 'Availability',
    multiple: true,
    advanced: true,
    options: [
      { value: 'open', label: 'Open now' },
      { value: 'bookable', label: 'Bookable tour' },
    ],
  },
  {
    id: 'amenities',
    title: 'Good to know',
    multiple: true,
    advanced: true,
    options: ['Good for kids', 'Wheelchair accessible', 'Outdoors'].map((value) => ({
      value,
      label: value,
    })),
  },
];

/** Sections combine with AND. Prices combine with OR; amenities must all match. */
export function filterActivities(
  activities: Activity[],
  quick: QuickFilter,
  values: FilterValues,
): Activity[] {
  const { price = [], rating = [], availability = [], amenities = [] } = values;
  return activities.filter((activity) => {
    if (quick !== 'all' && activity.category !== quick) return false;
    if (price.length > 0 && !price.includes(String(activity.priceLevel))) return false;
    if (rating.length > 0 && (activity.rating ?? 0) < Number(rating[0])) return false;
    if (availability.includes('open') && !activity.openNow) return false;
    if (availability.includes('bookable') && !activity.bookable) return false;
    return amenities.every((amenity) => activity.amenities.includes(amenity));
  });
}
