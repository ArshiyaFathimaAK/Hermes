import type { StayService } from './contract';
import { liveStayService } from './live';

/** Live: needs the server running (see AGENTS.md at the repository root). Tests use mock.ts instead. */
export const stayService: StayService = liveStayService;
