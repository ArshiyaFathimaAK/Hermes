import type { Place } from '@/domain/place';
import { apiGet } from '@/services/api-client';

import type { PlaceService } from './contract';
import { mockPlaceService } from './mock';

/**
 * The finished example of a live service: copy this shape for yours.
 * The server's JSON already matches the app's types, so most methods are one line.
 */
export const livePlaceService: PlaceService = {
  search: (query) =>
    query.trim() ? apiGet<Place[]>('/places/search', { q: query }) : Promise.resolve([]),
  get: (placeId) => apiGet<Place>(`/places/${encodeURIComponent(placeId)}`),
  // Recent places belong to the person, so they will come from Supabase, not the server.
  recent: mockPlaceService.recent,
};
