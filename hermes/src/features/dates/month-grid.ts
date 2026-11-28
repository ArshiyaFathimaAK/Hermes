import type { DateRange, IsoDate } from '@/domain/dates';
import { addDays, addMonths, dayOfMonth, daysBetween, weekdayIndex } from '@/utils/dates';

// Where days sit in the month grid, and what a drag across them means. No React.

export const lastOfMonth = (month: IsoDate) => addDays(addMonths(month, 1), -1);

export function cellOf(month: IsoDate, date: IsoDate) {
  const index = weekdayIndex(month) + dayOfMonth(date) - 1;
  return { row: Math.floor(index / 7), column: index % 7 };
}

export const rowCount = (month: IsoDate) => cellOf(month, lastOfMonth(month)).row + 1;

interface GridSize {
  width: number;
  rowHeight: number;
}

/** The day under a finger. Outside the month, or before `min`, gives the closest day. */
export function dayAt(
  month: IsoDate,
  point: { x: number; y: number },
  { width, rowHeight }: GridSize,
  min: IsoDate,
): IsoDate {
  const column = Math.min(6, Math.max(0, Math.floor((point.x / width) * 7)));
  const row = Math.max(0, Math.floor(point.y / rowHeight));
  const date = addDays(month, row * 7 + column - weekdayIndex(month));
  const earliest = min > month ? min : month;
  const last = lastOfMonth(month);
  if (date < earliest) return earliest;
  return date > last ? last : date;
}

/** Grabbing one end of the range keeps the other; anywhere else starts a new range. */
export function dragAnchor(range: DateRange | undefined, from: IsoDate): IsoDate {
  if (range?.start === from) return range.end;
  if (range?.end === from) return range.start;
  return from;
}

export const orderedRange = (a: IsoDate, b: IsoDate): DateRange =>
  a <= b ? { start: a, end: b } : { start: b, end: a };

/** The columns to highlight in each week, or undefined for weeks outside the range. */
export function weekSpans(month: IsoDate, range?: DateRange) {
  const last = lastOfMonth(month);
  return Array.from({ length: rowCount(month) }, (_, row) => {
    if (!range || range.end < month || range.start > last) return undefined;
    const weekStart = addDays(month, row * 7 - weekdayIndex(month));
    const first = [range.start, weekStart, month].sort()[2];
    const final = [range.end, addDays(weekStart, 6), last].sort()[0];
    if (first > final) return undefined;
    return { from: daysBetween(weekStart, first), to: daysBetween(weekStart, final) };
  });
}
