import type { ActivityService } from './contract';
import { mockActivityService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const activityService: ActivityService = mockActivityService;
