import { samplePlaces } from '@/services/sample-data';

import type { PlaceService } from './contract';

export const mockPlaceService: PlaceService = {
  async search(query) {
    const q = query.trim().toLowerCase();
    return q ? samplePlaces.filter((p) => p.name.toLowerCase().startsWith(q)).slice(0, 5) : [];
  },
  async get(placeId) {
    const place = samplePlaces.find((p) => p.id === placeId);
    if (!place) throw new Error('We could not find that place.');
    return place;
  },
  async recent() {
    return samplePlaces.filter((p) => ['lisbon', 'kyoto', 'denver'].includes(p.id));
  },
};
