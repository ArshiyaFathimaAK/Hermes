import type { CurrentWeather, DailyWeather } from '@/domain/weather';
import { apiGet } from '@/services/api-client';

import type { WeatherService } from './contract';

/**
 * UC-07 View Weather, from the server (Open-Meteo). The JSON already matches `domain/weather.ts`.
 * Days the server has no weather for are missing from `daily`, never filled in.
 */
export const liveWeatherService: WeatherService = {
  current: (placeId) =>
    apiGet<CurrentWeather>(`/places/${encodeURIComponent(placeId)}/weather/current`),
  daily: (placeId, range) =>
    apiGet<DailyWeather[]>(`/places/${encodeURIComponent(placeId)}/weather/daily`, {
      start: range.start,
      end: range.end,
    }),
};
