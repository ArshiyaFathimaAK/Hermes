import type { WeatherService } from './contract';
import { liveWeatherService } from './live';

/** Live: needs the server running (see AGENTS.md at the repository root). Tests use mock.ts instead. */
export const weatherService: WeatherService = liveWeatherService;
