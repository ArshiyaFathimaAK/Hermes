import type { Activity, ActivityDetail } from '@/domain/activity';
import type { Place } from '@/domain/place';
import type { Stay } from '@/domain/stay';
import type { CurrentWeather, WeatherCondition } from '@/domain/weather';

import data from './sample-data.json';

/**
 * Sample data for every mock, typed. The JSON is shared with the server's mocks, so the app and the
 * server always agree on ids. Change sample data there, not in a mock.
 */
export const samplePlaces = data.places as Place[];

const images: Record<string, number> = {
  belem: require('@/assets/images/mock/belem-tower.svg'),
  alfama: require('@/assets/images/mock/alfama-tour.svg'),
  lxf: require('@/assets/images/mock/lx-factory.svg'),
  sintra: require('@/assets/images/mock/sintra-day-trip.svg'),
  market: require('@/assets/images/mock/time-out-market.svg'),
  miradouro: require('@/assets/images/mock/miradouro.svg'),
  'fushimi-inari': require('@/assets/images/mock/fushimi-inari.svg'),
  arashiyama: require('@/assets/images/mock/arashiyama.svg'),
  nishiki: require('@/assets/images/mock/nishiki-market.svg'),
  tea: require('@/assets/images/mock/tea-ceremony.svg'),
};

export const sampleActivities = (data.activities as Activity[]).map((activity) => ({
  ...activity,
  image: images[activity.id],
}));

/** Extra details for some activities; the rest show only the basics. */
export const sampleActivityDetails = data.activityDetails as Record<
  string,
  Partial<ActivityDetail>
>;

export const sampleStays = data.stays as Stay[];

interface SampleWeather {
  current: CurrentWeather;
  highs: number[];
  conditions: WeatherCondition[];
}

export function sampleWeather(placeId: string): SampleWeather {
  const weather = data.weather as unknown as Record<string, SampleWeather>;
  return weather[placeId] ?? weather.default;
}

/** Days after today that still get a forecast; later days are "typical" weather. */
export const sampleForecastDays = data.forecastDays;
