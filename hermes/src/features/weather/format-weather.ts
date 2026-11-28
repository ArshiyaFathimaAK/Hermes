import type { DailyWeather, WeatherCondition } from '@/domain/weather';

export const CONDITION_LABELS: Record<WeatherCondition, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
};

/** The lowest high, highest high and most common condition. */
export function summarizeDays(days: DailyWeather[]) {
  if (days.length === 0) return undefined;
  const highs = days.map((day) => day.high);
  const counts = new Map<WeatherCondition, number>();
  for (const day of days) counts.set(day.condition, (counts.get(day.condition) ?? 0) + 1);
  const [condition] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return { min: Math.min(...highs), max: Math.max(...highs), condition };
}
