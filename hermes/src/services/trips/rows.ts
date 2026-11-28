import { DAY_SLOTS, type DaySlot, type Trip, type TripItem } from '@/domain/trip';
import type { Database } from '@/services/database.types';

type Tables = Database['public']['Tables'];
type TripRow = Tables['trips']['Row'];
type PlaceRow = Pick<
  Tables['trip_places']['Row'],
  'place_id' | 'position' | 'stay_id' | 'created_at'
>;
type ItemRow = Pick<
  Tables['trip_items']['Row'],
  'activity_id' | 'place_id' | 'day' | 'slot' | 'sort_order' | 'created_at'
>;

/** What load() selects: a trip with its places and items nested. */
export const TRIP_SELECT =
  'id, name, start_date, end_date, trip_places(place_id, position, stay_id, created_at), trip_items(activity_id, place_id, day, slot, sort_order, created_at)';

export type TripWithRows = Pick<TripRow, 'id' | 'name' | 'start_date' | 'end_date'> & {
  trip_places: PlaceRow[];
  trip_items: ItemRow[];
};

const isSlot = (slot: string | null): slot is DaySlot => DAY_SLOTS.includes(slot as DaySlot);

const byOrder = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at);

/** Database rows to the app's Trip. Kept apart from the network calls so it can be tested. */
export function tripFromRows(row: TripWithRows): Trip {
  const places = [...row.trip_places].sort((a, b) => a.position - b.position || byOrder(a, b));
  const items = [...row.trip_items].sort((a, b) => a.sort_order - b.sort_order || byOrder(a, b));
  return {
    id: row.id,
    name: row.name,
    dates:
      row.start_date && row.end_date ? { start: row.start_date, end: row.end_date } : undefined,
    placeIds: places.map((place) => place.place_id),
    stayIds: Object.fromEntries(
      places.filter((place) => place.stay_id).map((place) => [place.place_id, place.stay_id!]),
    ),
    items: items.map((item): TripItem => ({
      activityId: item.activity_id,
      placeId: item.place_id,
      // A slot the app doesn't know (added later) shows as "not on a day" rather than crashing.
      schedule:
        item.day !== null && isSlot(item.slot) ? { day: item.day, slot: item.slot } : undefined,
    })),
  };
}
