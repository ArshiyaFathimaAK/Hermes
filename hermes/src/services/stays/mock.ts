import { sampleStays } from '@/services/sample-data';

import type { StayService } from './contract';

export const mockStayService: StayService = {
  async list(placeId) {
    return sampleStays.filter((s) => s.placeId === placeId);
  },
  async getMany(stayIds) {
    return sampleStays.filter((s) => stayIds.includes(s.id));
  },
};
