import type { SharingService } from './contract';
import { mockSharingService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const sharingService: SharingService = mockSharingService;
