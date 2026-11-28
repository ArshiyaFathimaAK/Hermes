import { activityService } from '@/services/activities';

import type { ItineraryService } from './contract';
import {
  checkRequest,
  planRequestFor,
  planWithRules,
  type Catalog,
  type PlanRequest,
} from './rules';

/** The things to do at the trip's places, plus any saved thing that isn't listed there. */
async function loadCatalog(request: PlanRequest): Promise<Catalog> {
  const places = [...new Set(request.placeIds)];
  const lists = await Promise.all(places.map((placeId) => activityService.list(placeId)));
  const byPlace = new Map(places.map((placeId, i) => [placeId, lists[i]]));
  const byId = new Map(lists.flat().map((activity) => [activity.id, activity]));
  const missing = request.items.map((item) => item.activityId).filter((id) => !byId.has(id));
  if (missing.length > 0) {
    for (const activity of await activityService.getMany(missing)) {
      if (!byId.has(activity.id)) byId.set(activity.id, activity);
    }
  }
  return { byPlace, byId };
}

/** Plans with the simple rules only, like the server without an OpenAI key. */
export const mockItineraryService: ItineraryService = {
  async generate(trip, options) {
    const request = planRequestFor(trip, options);
    checkRequest(request);
    return { source: 'rules', entries: planWithRules(request, await loadCatalog(request)) };
  },
};
