import type { WeatherService } from './contract';
import { mockWeatherService } from './mock';

/** Swap the mock for the real implementation here. Nothing else needs to change. */
export const weatherService: WeatherService = mockWeatherService;
