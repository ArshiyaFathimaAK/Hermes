import type { TripService } from './contract';
import { mockTripService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const tripService: TripService = mockTripService;
