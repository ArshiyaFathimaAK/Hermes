import { useCallback } from 'react';

import type { DateRange } from '@/domain/dates';
import type { DailyWeather } from '@/domain/weather';
import { weatherService } from '@/services/weather';
import { useAsync } from '@/utils/use-async';

export function useCurrentWeather(placeId: string) {
  return useAsync(useCallback(() => weatherService.current(placeId), [placeId]));
}

const NO_DAYS: DailyWeather[] = [];

/** Ready with an empty list until there are dates. */
export function useDailyWeather(placeId?: string, range?: DateRange) {
  const start = range?.start;
  const end = range?.end;
  return useAsync(
    useCallback(
      () =>
        placeId && start && end
          ? weatherService.daily(placeId, { start, end })
          : Promise.resolve(NO_DAYS),
      [placeId, start, end],
    ),
  );
}
