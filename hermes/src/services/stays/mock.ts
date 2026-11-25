import type { Stay } from '@/domain/stay';

import type { StayService } from './contract';

const STAYS: Stay[] = [
  {
    id: 'river', placeId: 'lisbon', name: 'Riverside apartment, Cais do Sodré', kind: 'Apartment',
    area: 'Cais do Sodré', score: 8.9, scoreWord: 'Excellent', reviewCount: '1,240',
    near: '10 min walk to 2 of your 3 saves', nightly: 138, freeCancellation: true,
    amenities: ['Wi-Fi', 'Kitchen'], mapPosition: { x: 0.56, y: 0.5 },
  },
  {
    id: 'belem-house', placeId: 'lisbon', name: 'Guesthouse in Belém', kind: 'Guesthouse',
    area: 'Belém', score: 9.2, scoreWord: 'Wonderful', reviewCount: '410',
    near: '5 min walk to Belém Tower', nightly: 96, freeCancellation: false,
    amenities: ['Wi-Fi', 'Breakfast'], mapPosition: { x: 0.14, y: 0.55 },
  },
  {
    id: 'chiado', placeId: 'lisbon', name: 'Boutique hotel in Chiado', kind: 'Hotel',
    area: 'Chiado', score: 8.6, scoreWord: 'Excellent', reviewCount: '2,870',
    near: '15 min by tram to all 3 saves', nightly: 185, freeCancellation: true,
    amenities: ['Wi-Fi', 'Breakfast', 'Pool'], mapPosition: { x: 0.8, y: 0.27 },
  },
  {
    id: 'gion-inn', placeId: 'kyoto', name: 'Traditional inn in Gion', kind: 'Guesthouse',
    area: 'Gion', score: 9.1, scoreWord: 'Wonderful', reviewCount: '620',
    near: '12 min walk to Nishiki Market', nightly: 164, freeCancellation: false,
    amenities: ['Wi-Fi', 'Breakfast'], mapPosition: { x: 0.68, y: 0.5 },
  },
  {
    id: 'station-hotel', placeId: 'kyoto', name: 'Hotel by Kyoto Station', kind: 'Hotel',
    area: 'Shimogyo', score: 8.4, scoreWord: 'Very good', reviewCount: '3,150',
    near: '10 min by train to Fushimi Inari', nightly: 112, freeCancellation: true,
    amenities: ['Wi-Fi'], mapPosition: { x: 0.36, y: 0.22 },
  },
];

export const mockStayService: StayService = {
  async list(placeId) {
    return STAYS.filter((s) => s.placeId === placeId);
  },
  async getMany(stayIds) {
    return STAYS.filter((s) => stayIds.includes(s.id));
  },
};
