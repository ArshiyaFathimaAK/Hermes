import { useCallback } from 'react';

import { placeService } from '@/services/places';
import { useTrips } from '@/state/trips';
import { useAsync } from '@/utils/use-async';

export function useDestination(placeId: string) {
  const place = useAsync(useCallback(() => placeService.get(placeId), [placeId]));
  const { datesForPlace, tripForPlace } = useTrips();
  return { place, dates: datesForPlace(placeId), trip: tripForPlace(placeId) };
}
