import type { WeatherCondition } from '@/domain/weather';
import { daysBetween, eachDay, today } from '@/utils/dates';

import type { WeatherService } from './contract';

const HIGHS = [64, 61, 59, 62, 63, 61, 62];
const CONDITIONS: WeatherCondition[] = ['sunny', 'cloudy', 'rainy', 'cloudy', 'sunny', 'sunny', 'cloudy'];
const FORECAST_DAYS = 16;

export const mockWeatherService: WeatherService = {
  async current(placeId) {
    if (placeId === 'kyoto') return { temperature: 55, condition: 'cloudy' };
    return { temperature: 64, condition: 'sunny' };
  },
  async daily(placeId, range) {
    // Kyoto is colder, so switching places visibly changes the forecast.
    const shift = placeId === 'kyoto' ? -8 : 0;
    return eachDay(range).map((date, i) => ({
      date,
      high: HIGHS[i % HIGHS.length] + shift,
      low: HIGHS[i % HIGHS.length] + shift - 10,
      condition: CONDITIONS[i % CONDITIONS.length],
      isTypical: daysBetween(today(), date) > FORECAST_DAYS,
    }));
  },
};
