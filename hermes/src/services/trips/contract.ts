import type { Trip } from '@/domain/trip';

/** UC-08 Create Trip, UC-10 Build Itinerary: storage. Rules live in state/trips/trip-logic.ts. */
export interface TripService {
  load(userId: string): Promise<Trip[]>;
  save(userId: string, trips: Trip[]): Promise<void>;
}
