import { useCallback } from 'react';

import type { Activity } from '@/domain/activity';
import type { Place } from '@/domain/place';
import type { Stay } from '@/domain/stay';
import type { Trip } from '@/domain/trip';
import { activityService } from '@/services/activities';
import { placeService } from '@/services/places';
import { stayService } from '@/services/stays';
import { useAsync } from '@/utils/use-async';

export interface TripDetails {
  places: Place[];
  activities: Map<string, Activity>;
  stays: Stay[];
}

/** Trips store ids only, so this fetches what to show for them. */
export function useTripDetails(trip: Omit<Trip, 'id'>) {
  // Joined so that the loader only changes when the ids do.
  const placeKey = trip.placeIds.join();
  const activityKey = trip.items
    .map((item) => item.activityId)
    .sort()
    .join();
  const stayKey = Object.values(trip.stayIds).join();

  return useAsync(
    useCallback(async (): Promise<TripDetails> => {
      const split = (key: string) => key.split(',').filter(Boolean);
      const [places, activities, stays] = await Promise.all([
        Promise.all(split(placeKey).map((id) => placeService.get(id))),
        activityService.getMany(split(activityKey)),
        stayService.getMany(split(stayKey)),
      ]);
      return { places, activities: new Map(activities.map((a) => [a.id, a])), stays };
    }, [placeKey, activityKey, stayKey]),
  );
}
