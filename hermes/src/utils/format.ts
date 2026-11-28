export type TemperatureUnit = 'F' | 'C';

export function formatTemperature(fahrenheit: number, unit: TemperatureUnit) {
  return `${Math.round(unit === 'F' ? fahrenheit : ((fahrenheit - 32) * 5) / 9)}°`;
}

export const formatMoney = (amount: number) => `$${Math.round(amount).toLocaleString('en-US')}`;

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;
