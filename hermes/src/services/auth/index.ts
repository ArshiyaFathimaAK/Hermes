import type { AuthService } from './contract';
import { mockAuthService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const authService: AuthService = mockAuthService;
