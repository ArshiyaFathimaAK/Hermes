import type { ProfileService } from './contract';
import { mockProfileService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const profileService: ProfileService = mockProfileService;
