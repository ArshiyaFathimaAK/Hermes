import type { IsoDate } from './dates';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

/** Temperatures are always Fahrenheit here; `formatTemperature` converts for display. */
export interface CurrentWeather {
  temperature: number;
  condition: WeatherCondition;
}

export interface DailyWeather {
  date: IsoDate;
  high: number;
  low: number;
  condition: WeatherCondition;
  /** True when this is past-years weather rather than a forecast. */
  isTypical: boolean;
}
