import type { Place } from '@/domain/place';
import { apiGet } from '@/services/api-client';

import { MIN_SEARCH_LENGTH, type PlaceService } from './contract';
import { mockPlaceService } from './mock';

/**
 * The finished example of a live service: copy this shape for yours.
 * The server's JSON already matches the app's types, so most methods are one line.
 * The server searches Google Places when it has a key, and the sample places otherwise.
 */
export const livePlaceService: PlaceService = {
  search: (query) =>
    query.trim().length >= MIN_SEARCH_LENGTH
      ? apiGet<Place[]>('/places/search', { q: query.trim() })
      : Promise.resolve([]),
  get: (placeId) => apiGet<Place>(`/places/${encodeURIComponent(placeId)}`),
  // Recent places belong to the person, so they will come from Supabase, not the server.
  recent: mockPlaceService.recent,
};
