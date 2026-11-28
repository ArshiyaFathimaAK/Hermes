import { useCallback, useState } from 'react';

import type { Place } from '@/domain/place';
import { goBack } from '@/navigation/routes';
import { placeService } from '@/services/places';
import { useTrips } from '@/state/trips';
import { useAsync } from '@/utils/use-async';

/** Adds to the trip, or starts a new one when there is no trip id. */
export function usePickPlace(tripId?: string) {
  const { trips, createTrip, addPlace } = useTrips();
  const [query, setQuery] = useState('');
  const places = useAsync(
    useCallback(
      () => (query.trim() ? placeService.search(query) : placeService.recent()),
      [query],
    ),
  );
  const trip = trips.find((t) => t.id === tripId);

  function pick(place: Place) {
    if (trip) addPlace(trip.id, place.id);
    else createTrip(place);
    goBack();
  }

  return { query, setQuery, isSearching: query.trim() !== '', places, trip, pick };
}
