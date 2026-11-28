import type { Trip, TripSchedule } from '@/domain/trip';

/** Something the plan puts on a day: a saved thing, or a suggestion that isn't in the trip yet. */
export interface PlanEntry {
  activityId: string;
  placeId: string;
  schedule: TripSchedule;
  suggested: boolean;
}

export interface ItineraryPlan {
  /** 'ai' when the AI made the plan, 'rules' when the simple rules did (no AI, or it failed). */
  source: 'ai' | 'rules';
  /** Only what changes, in the order to add it. Things that already have a day stay put. */
  entries: PlanEntry[];
}

export interface PlanOptions {
  /** Also suggest other things to do at the trip's places. */
  addSuggestions: boolean;
}

/**
 * Generate AI Itinerary. Matches server/hermes_api/features/itinerary/models.py.
 * Rejects with an Error people can read, such as for a trip without dates.
 */
export interface ItineraryService {
  generate(trip: Trip, options?: PlanOptions): Promise<ItineraryPlan>;
}
