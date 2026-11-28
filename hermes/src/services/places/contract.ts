import type { Place } from '@/domain/place';

/** Shorter searches return nothing, so a single letter never costs a call to Google. */
export const MIN_SEARCH_LENGTH = 2;

/** UC-04 Search for Destination. */
export interface PlaceService {
  /** Up to 5 places. Empty for a query under MIN_SEARCH_LENGTH characters. */
  search(query: string): Promise<Place[]>;
  get(placeId: string): Promise<Place>;
  recent(): Promise<Place[]>;
}
