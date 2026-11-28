import type { Trip } from '@/domain/trip';

/** What someone with the link may see: no owner and no trip id. */
export type SharedTrip = Omit<Trip, 'id'>;

/** UC-12 Share Trip. */
export interface SharingService {
  createLink(trip: Trip): Promise<{ token: string; url: string }>;
  view(token: string): Promise<SharedTrip>;
}
