import { useCallback, useState } from 'react';

import { placeService } from '@/services/places';
import { useTrips } from '@/state/trips';
import { today } from '@/utils/dates';
import { useAsync } from '@/utils/use-async';

/** UC-04 Search for Destination. Works without an account. */
export function useExplore() {
  const [query, setQuery] = useState('');
  const { trips } = useTrips();

  const results = useAsync(useCallback(() => placeService.search(query), [query]));
  const recent = useAsync(useCallback(() => placeService.recent(), []));

  // Soonest trip that isn't over, or the first one without dates.
  const now = today();
  const upcoming = trips
    .filter((trip) => trip.dates && trip.dates.end >= now)
    .sort((a, b) => a.dates!.start.localeCompare(b.dates!.start));
  const upNext = upcoming[0] ?? trips.find((trip) => !trip.dates);

  return { query, setQuery, isSearching: query.trim().length > 0, results, recent, upNext };
}
