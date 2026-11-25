import type { DateRange } from './dates';

export const DAY_SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type DaySlot = (typeof DAY_SLOTS)[number];

export interface TripSchedule {
  /** 0 = first day of the trip. */
  day: number;
  slot: DaySlot;
}

/** Trips store ids only. Names and photos are fetched when shown. */
export interface TripItem {
  activityId: string;
  placeId: string;
  /** Missing until the user puts it on a day. */
  schedule?: TripSchedule;
}

export interface Trip {
  id: string;
  name: string;
  /** Usually one place, but a trip may hold several. */
  placeIds: string[];
  dates?: DateRange;
  /** Array order is the order within each slot. */
  items: TripItem[];
  /** Chosen stay for each place: placeId -> stayId. */
  stayIds: Record<string, string>;
}
