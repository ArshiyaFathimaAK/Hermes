import { useCallback, useState } from 'react';

import type { DateRange } from '@/domain/dates';
import { stayService } from '@/services/stays';
import type { FilterValues } from '@/ui/filter-sheet';
import { useAsync } from '@/utils/use-async';

import { filterStays, type StaySort } from './filter-stays';

/** UC-05 and UC-06 for lodging. Prices are for `dates`; without them nothing is asked for. */
export function useStays(placeId: string, dates: DateRange | undefined) {
  // Strings, not the object: a new object with the same days must not search again.
  const start = dates?.start;
  const end = dates?.end;
  const all = useAsync(
    useCallback(
      () =>
        start && end && start < end
          ? stayService.list(placeId, { start, end })
          : Promise.resolve([]),
      [placeId, start, end],
    ),
  );
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState<StaySort>('recommended');

  const visible = all.status === 'ready' ? filterStays(all.data, filters, sort) : [];

  return { all, visible, filters, setFilters, sort, setSort };
}
