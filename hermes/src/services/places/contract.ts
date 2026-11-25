import type { Place } from '@/domain/place';

/** UC-04 Search for Destination. */
export interface PlaceService {
  search(query: string): Promise<Place[]>;
  get(placeId: string): Promise<Place>;
  recent(): Promise<Place[]>;
}
