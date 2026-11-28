import { sampleForecastDays, sampleWeather } from '@/services/sample-data';
import { daysBetween, eachDay, today } from '@/utils/dates';

import type { WeatherService } from './contract';

export const mockWeatherService: WeatherService = {
  async current(placeId) {
    return sampleWeather(placeId).current;
  },
  async daily(placeId, range) {
    const { highs, conditions } = sampleWeather(placeId);
    return eachDay(range).map((date, i) => ({
      date,
      high: highs[i % highs.length],
      low: highs[i % highs.length] - 10,
      condition: conditions[i % conditions.length],
      isTypical: daysBetween(today(), date) > sampleForecastDays,
    }));
  },
};
