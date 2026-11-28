import { sampleActivities, sampleActivityDetails } from '@/services/sample-data';

import type { ActivityService } from './contract';

export const mockActivityService: ActivityService = {
  async list(placeId) {
    return sampleActivities.filter((a) => a.placeId === placeId);
  },
  async getMany(activityIds) {
    return sampleActivities.filter((a) => activityIds.includes(a.id));
  },
  async detail(activityId) {
    const activity = sampleActivities.find((a) => a.id === activityId);
    if (!activity) throw new Error('We could not find that.');
    const query = encodeURIComponent(`${activity.name} ${activity.placeId}`);
    return {
      ...activity,
      nearby: [],
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
      ...sampleActivityDetails[activityId],
    };
  },
};
