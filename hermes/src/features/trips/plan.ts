import { DAY_SLOTS, type DaySlot, type TripItem } from '@/domain/trip';

export const SLOT_LABELS: Record<DaySlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function itemsBySlot(items: TripItem[], day: number) {
  return DAY_SLOTS.map((slot) => ({
    slot,
    items: items.filter((i) => i.schedule?.day === day && i.schedule.slot === slot),
  }));
}

export const unscheduledItems = (items: TripItem[]) => items.filter((item) => !item.schedule);
