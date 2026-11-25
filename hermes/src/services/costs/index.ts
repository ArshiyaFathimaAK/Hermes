import type { CostService } from './contract';
import { mockCostService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const costService: CostService = mockCostService;
