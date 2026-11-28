import { apiPost } from '@/services/api-client';

import type { ItineraryPlan, ItineraryService } from './contract';
import { checkRequest, planRequestFor } from './rules';

/**
 * Plans on the Python server: by the AI when the server has an OpenAI key, otherwise by the same
 * simple rules as the mock. The answer says which (`source`).
 */
export const liveItineraryService: ItineraryService = {
  async generate(trip, options) {
    const request = planRequestFor(trip, options);
    // Same checks as the server, so a trip without dates doesn't need a call.
    checkRequest(request);
    return apiPost<ItineraryPlan>('/itinerary/generate', request);
  },
};
