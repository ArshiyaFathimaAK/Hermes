import type { Activity, ActivityDetail } from '@/domain/activity';

/** UC-06 View Destination. Filtering (UC-05) happens in features/things-to-do. */
export interface ActivityService {
  list(placeId: string): Promise<Activity[]>;
  /** Looks up several at once. Ids that no longer exist are left out. */
  getMany(activityIds: string[]): Promise<Activity[]>;
  detail(activityId: string): Promise<ActivityDetail>;
}
