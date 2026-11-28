import type { Trip } from '@/domain/trip';

import type { TripChange } from './changes';

/**
 * UC-08 Create Trip, UC-09 View Saved Trips, UC-10 Build Itinerary: storage.
 * Rules live in state/trips/trip-logic.ts; this only loads trips and stores changes.
 * Tables: trips, trip_places, trip_items (supabase/migrations).
 */
export interface TripService {
  /** Every trip the person owns, with their places, items and stays. */
  load(userId: string): Promise<Trip[]>;
  /**
   * Stores changes, in the order given, which is safe for foreign keys.
   * Reject with an Error people can read; the app then reloads to stay in step.
   */
  apply(userId: string, changes: TripChange[]): Promise<void>;
  /** Ids for new trips. The database needs UUIDs; the mock uses readable ids. */
  newTripId?: () => string;
}
