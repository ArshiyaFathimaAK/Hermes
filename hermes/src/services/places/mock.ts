import type { Place } from '@/domain/place';

import type { PlaceService } from './contract';

const PLACES: Place[] = [
  { id: 'lisbon', name: 'Lisbon', region: 'Portugal' },
  { id: 'lille', name: 'Lille', region: 'France' },
  { id: 'lima', name: 'Lima', region: 'Peru' },
  { id: 'kyoto', name: 'Kyoto', region: 'Japan' },
  { id: 'denver', name: 'Denver', region: 'Colorado, USA' },
  { id: 'mexico-city', name: 'Mexico City', region: 'Mexico' },
  { id: 'lyon', name: 'Lyon', region: 'France' },
  { id: 'ljubljana', name: 'Ljubljana', region: 'Slovenia' },
];

export const mockPlaceService: PlaceService = {
  async search(query) {
    const q = query.trim().toLowerCase();
    return q ? PLACES.filter((p) => p.name.toLowerCase().startsWith(q)).slice(0, 5) : [];
  },
  async get(placeId) {
    const place = PLACES.find((p) => p.id === placeId);
    if (!place) throw new Error('We could not find that place.');
    return place;
  },
  async recent() {
    return PLACES.filter((p) => ['lisbon', 'kyoto', 'denver'].includes(p.id));
  },
};
