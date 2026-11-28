import { useCallback, useState } from 'react';

import { activityService } from '@/services/activities';
import type { FilterValues } from '@/ui/filter-sheet';
import { useAsync } from '@/utils/use-async';

import { filterActivities, type QuickFilter } from './filter-activities';

/** UC-05 and UC-06. */
export function useThingsToDo(placeId: string) {
  const all = useAsync(useCallback(() => activityService.list(placeId), [placeId]));
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [filters, setFilters] = useState<FilterValues>({});

  const visible = all.status === 'ready' ? filterActivities(all.data, quick, filters) : [];

  return {
    all,
    visible,
    quick,
    setQuick,
    filters,
    setFilters,
    clearFilters: () => {
      setQuick('all');
      setFilters({});
    },
  };
}
