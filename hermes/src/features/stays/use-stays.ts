import { useCallback, useState } from 'react';

import { stayService } from '@/services/stays';
import type { FilterValues } from '@/ui/filter-sheet';
import { useAsync } from '@/utils/use-async';

import { filterStays, type StaySort } from './filter-stays';

/** UC-05 and UC-06 for lodging. */
export function useStays(placeId: string) {
  const all = useAsync(useCallback(() => stayService.list(placeId), [placeId]));
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState<StaySort>('recommended');

  const visible = all.status === 'ready' ? filterStays(all.data, filters, sort) : [];

  return { all, visible, filters, setFilters, sort, setSort };
}
