import type { DateRange } from '@/domain/dates';
import { addDays, addMonths, firstOfMonth, today, weekdayIndex } from '@/utils/dates';

/** Shortcuts above the calendar. */
export function getDatePresets(): { label: string; range: DateRange }[] {
  const now = today();
  // Today counts when it is already Friday.
  const friday = addDays(now, (5 - weekdayIndex(now) + 7) % 7);
  const nextMonth = addMonths(firstOfMonth(now), 1);
  return [
    { label: 'This weekend', range: { start: friday, end: addDays(friday, 2) } },
    { label: 'Next weekend', range: { start: addDays(friday, 7), end: addDays(friday, 9) } },
    { label: 'Start of next month', range: { start: nextMonth, end: addDays(nextMonth, 4) } },
  ];
}
