import type { StayService } from './contract';
import { mockStayService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const stayService: StayService = mockStayService;
