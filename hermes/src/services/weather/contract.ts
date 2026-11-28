import type { DateRange } from '@/domain/dates';
import type { CurrentWeather, DailyWeather } from '@/domain/weather';

/** UC-07 View Weather. */
export interface WeatherService {
  current(placeId: string): Promise<CurrentWeather>;
  /** One entry per day. Days past the forecast window come back with `isTypical`. */
  daily(placeId: string, range: DateRange): Promise<DailyWeather[]>;
}
