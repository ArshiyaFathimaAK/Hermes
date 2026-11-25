import type { Trip } from '@/domain/trip';

export interface CostEstimate {
  lodging: number;
  activities: number;
  total: number;
  /** How many saved things have no known price. */
  unpriced: number;
}

/** UC-11 View Estimated Trip Cost. */
export interface CostService {
  estimate(trip: Trip): Promise<CostEstimate>;
}
