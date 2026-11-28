import { activityService } from '@/services/activities';
import { stayService } from '@/services/stays';
import { daysBetween } from '@/utils/dates';

import type { CostService } from './contract';

/** Rough rule for the demo: every priced activity once, plus every chosen stay for all nights. */
export const mockCostService: CostService = {
  async estimate(trip) {
    const [activities, stays] = await Promise.all([
      activityService.getMany(trip.items.map((item) => item.activityId)),
      // Live stay prices depend on the dates.
      stayService.getMany(Object.values(trip.stayIds), trip.dates),
    ]);
    const nights = trip.dates ? daysBetween(trip.dates.start, trip.dates.end) : 0;
    // A stay without a price adds nothing rather than a guess.
    const lodging = stays.reduce((sum, stay) => sum + (stay.nightly ?? 0) * nights, 0);
    const priced = activities.filter((a) => a.priceAmount !== undefined);
    const activityTotal = priced.reduce((sum, a) => sum + (a.priceAmount ?? 0), 0);
    return {
      lodging,
      activities: activityTotal,
      total: lodging + activityTotal,
      unpriced: activities.length - priced.length,
    };
  },
};
