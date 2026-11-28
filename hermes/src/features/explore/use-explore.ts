import { useCallback, useState } from 'react';

import { placeService } from '@/services/places';
import { MIN_SEARCH_LENGTH } from '@/services/places/contract';
import { useTrips } from '@/state/trips';
import { today } from '@/utils/dates';
import { useAsync, type AsyncState } from '@/utils/use-async';
import { useDebouncedValue } from '@/utils/use-debounced-value';

/** Wait this long after the last key before searching: each search can cost a call to Google. */
export const SEARCH_DELAY_MS = 300;

const WAITING: AsyncState<never> = { status: 'loading' };

/** UC-04 Search for Destination. Works without an account. */
export function useExplore() {
  const [query, setQuery] = useState('');
  const { trips } = useTrips();

  const typed = query.trim();
  const isSearching = typed.length >= MIN_SEARCH_LENGTH;
  const searchFor = useDebouncedValue(isSearching ? typed : '', SEARCH_DELAY_MS);
  const found = useAsync(
    useCallback(
      () => (searchFor ? placeService.search(searchFor) : Promise.resolve([])),
      [searchFor],
    ),
  );
  // Still typing: show the spinner rather than results for an older query.
  const results = searchFor === typed ? found : WAITING;
  const recent = useAsync(useCallback(() => placeService.recent(), []));

  // Soonest trip that isn't over, or the first one without dates.
  const now = today();
  const upcoming = trips
    .filter((trip) => trip.dates && trip.dates.end >= now)
    .sort((a, b) => a.dates!.start.localeCompare(b.dates!.start));
  const upNext = upcoming[0] ?? trips.find((trip) => !trip.dates);

  return { query, setQuery, isSearching, results, recent, upNext };
}
