import type { DateRange } from '@/domain/dates';
import type { Stay } from '@/domain/stay';

/** UC-06 View Lodging. Prices depend on dates: pass the trip's dates whenever there are some. */
export interface StayService {
  /** Stays near a place. With dates, only ones with a room then, priced for those dates. */
  list(placeId: string, dates?: DateRange): Promise<Stay[]>;
  /** Unknown ids are left out. With dates, priced for them; a stay with no room has no price. */
  getMany(stayIds: string[], dates?: DateRange): Promise<Stay[]>;
}
