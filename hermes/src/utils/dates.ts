import type { DateRange, IsoDate } from '@/domain/dates';

const DAY_MS = 86_400_000;

// UTC is only used for arithmetic; the calendar day never changes.
const toUtc = (date: IsoDate) => Date.parse(`${date}T00:00:00Z`);

function format(date: IsoDate, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(toUtc(date));
}

export function today(): IsoDate {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, '0')}`;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(start: IsoDate, end: IsoDate) {
  return Math.round((toUtc(end) - toUtc(start)) / DAY_MS);
}

/** Every day in the range, both ends included. */
export function eachDay({ start, end }: DateRange): IsoDate[] {
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => addDays(start, i));
}

/** 0 = Sunday. */
export const weekdayIndex = (date: IsoDate) => new Date(toUtc(date)).getUTCDay();
export const dayOfMonth = (date: IsoDate) => Number(date.slice(8));
export const firstOfMonth = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01`;

export function addMonths(date: IsoDate, months: number): IsoDate {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
}

export const formatWeekday = (date: IsoDate) => format(date, { weekday: 'short' });
export const formatMonth = (date: IsoDate) => format(date, { month: 'long', year: 'numeric' });
export const formatShort = (date: IsoDate) => format(date, { month: 'short', day: 'numeric' });
export const formatLong = (date: IsoDate) =>
  format(date, { weekday: 'long', month: 'short', day: 'numeric' });

export function formatRange({ start, end }: DateRange) {
  if (start === end) return formatShort(start);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return `${formatShort(start)} – ${sameMonth ? dayOfMonth(end) : formatShort(end)}`;
}

export function formatCountdown(start: IsoDate) {
  const days = daysBetween(today(), start);
  if (days < 0) return 'Started';
  if (days === 0) return 'Today';
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
}
