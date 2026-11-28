import type { ProfileService } from './contract';
import { mockProfileService } from './mock';

/**
 * Swap the mock for the real implementation here. Nothing else needs to change.
 * `./live` (liveProfileService) is ready: switch to it once sign-in (UC-01/02) is live, since
 * Supabase only saves a profile for someone who is really signed in.
 */
export const profileService: ProfileService = mockProfileService;
