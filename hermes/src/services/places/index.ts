import type { PlaceService } from './contract';
import { mockPlaceService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const placeService: PlaceService = mockPlaceService;
