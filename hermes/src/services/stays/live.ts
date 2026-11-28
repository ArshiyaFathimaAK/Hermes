import type { DateRange } from '@/domain/dates';
import type { Stay, StayDetail } from '@/domain/stay';
import { apiGet } from '@/services/api-client';

import type { StayService } from './contract';

/** Hotels from LiteAPI through the server, or the sample stays when the server has no key. */
const datesQuery = (dates?: DateRange) =>
  dates ? { checkIn: dates.start, checkOut: dates.end } : {};

export const liveStayService: StayService = {
  list: (placeId, dates) =>
    apiGet<Stay[]>(`/places/${encodeURIComponent(placeId)}/stays`, datesQuery(dates)),
  getMany: (stayIds, dates) =>
    stayIds.length === 0
      ? Promise.resolve([])
      : apiGet<Stay[]>('/stays', { ids: stayIds.join(','), ...datesQuery(dates) }),
  detail: (stayId, dates) =>
    apiGet<StayDetail>(`/stays/${encodeURIComponent(stayId)}`, datesQuery(dates)),
};
