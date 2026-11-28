import { useCallback } from 'react';

import type { Place } from '@/domain/place';
import type { StayDetail } from '@/domain/stay';
import { placeService } from '@/services/places';
import { stayService } from '@/services/stays';
import { useAccountGate } from '@/state/session';
import { useTrips } from '@/state/trips';
import { daysBetween } from '@/utils/dates';
import { useAsync } from '@/utils/use-async';

/** UC-06 one stay's own screen: its details, priced for the trip's dates, and choosing it. */
export function useStay(stayId: string, placeId: string) {
  const { datesForPlace, tripForPlace, toggleStay } = useTrips();
  const gate = useAccountGate();

  const dates = datesForPlace(placeId);
  const state = useStayAndPlace(stayId, placeId, dates?.start, dates?.end);
  const place = state.status === 'ready' ? state.data.place : undefined;
  const trip = tripForPlace(placeId);

  return {
    state,
    dates,
    nights: dates ? daysBetween(dates.start, dates.end) : 0,
    chosen: trip?.stayIds[placeId] === stayId,
    tripName: trip?.name,
    toggleChosen: () => {
      if (place) gate('save-to-trip', () => toggleStay(place, stayId));
    },
  };
}

/** Days as strings, not an object: a new object with the same days must not load again. */
function useStayAndPlace(stayId: string, placeId: string, start?: string, end?: string) {
  return useAsync(
    useCallback(async (): Promise<{ stay: StayDetail; place: Place }> => {
      const range = start && end && start < end ? { start, end } : undefined;
      const [stay, place] = await Promise.all([
        stayService.detail(stayId, range),
        placeService.get(placeId),
      ]);
      return { stay, place };
    }, [stayId, placeId, start, end]),
  );
}
