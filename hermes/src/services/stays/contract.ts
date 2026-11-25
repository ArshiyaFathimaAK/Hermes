import type { Stay } from '@/domain/stay';

/** UC-06 View Lodging. */
export interface StayService {
  list(placeId: string): Promise<Stay[]>;
  getMany(stayIds: string[]): Promise<Stay[]>;
}
