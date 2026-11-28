import { useCallback } from 'react';

import type { ActivityDetail } from '@/domain/activity';
import type { Place } from '@/domain/place';
import { activityService } from '@/services/activities';
import { placeService } from '@/services/places';
import { useAccountGate } from '@/state/session';
import { useTrips } from '@/state/trips';
import { useAsync } from '@/utils/use-async';

/** UC-06 View Destination details. */
export function useActivity(activityId: string) {
  const { isSaved, toggleActivity, datesForPlace, tripForPlace } = useTrips();
  const gate = useAccountGate();

  const state = useAsync(
    useCallback(async (): Promise<{ activity: ActivityDetail; place: Place }> => {
      const activity = await activityService.detail(activityId);
      return { activity, place: await placeService.get(activity.placeId) };
    }, [activityId]),
  );
  const place = state.status === 'ready' ? state.data.place : undefined;

  return {
    state,
    place,
    saved: place !== undefined && isSaved(place.id, activityId),
    tripName: place && tripForPlace(place.id)?.name,
    dates: place && datesForPlace(place.id),
    toggleSaved: () => {
      if (place) gate('save-to-trip', () => toggleActivity(place, activityId));
    },
  };
}
