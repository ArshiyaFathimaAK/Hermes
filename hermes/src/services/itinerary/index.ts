import type { ItineraryService } from './contract';
import { mockItineraryService } from './mock';

/**
 * Swap the mock for the real implementation here. Nothing else needs to change.
 * For AI plans: `liveItineraryService` from './live', with the server running and OPENAI_API_KEY
 * set in server/.env. Without the key the server plans with the same rules as the mock.
 */
export const itineraryService: ItineraryService = mockItineraryService;
