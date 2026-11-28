import { randomUUID } from 'expo-crypto';

import { getSupabase, must, mustChange } from '@/services/supabase';

import type { TripChange } from './changes';
import type { TripService } from './contract';
import { TRIP_SELECT, tripFromRows } from './rows';

const SAVE_FAILED = 'Your change could not be saved. Check your connection and try again.';

/** One change, one row. Row level security limits every call to the signed-in person's trips. */
async function applyOne(change: TripChange) {
  const db = getSupabase();
  switch (change.type) {
    case 'createTrip':
      return must(
        await db.from('trips').insert({
          id: change.tripId,
          name: change.name,
          start_date: change.dates?.start ?? null,
          end_date: change.dates?.end ?? null,
        }),
        SAVE_FAILED,
      );
    case 'updateTrip':
      return mustChange(
        await db
          .from('trips')
          .update({
            name: change.name,
            start_date: change.dates?.start ?? null,
            end_date: change.dates?.end ?? null,
          })
          .eq('id', change.tripId)
          .select('id'),
        SAVE_FAILED,
      );
    case 'deleteTrip':
      return mustChange(
        await db.from('trips').delete().eq('id', change.tripId).select('id'),
        SAVE_FAILED,
      );
    case 'addPlace':
      return must(
        await db
          .from('trip_places')
          .insert({ trip_id: change.tripId, place_id: change.placeId, position: change.position }),
        SAVE_FAILED,
      );
    case 'removePlace':
      return mustChange(
        await db
          .from('trip_places')
          .delete()
          .eq('trip_id', change.tripId)
          .eq('place_id', change.placeId)
          .select('place_id'),
        SAVE_FAILED,
      );
    case 'setStay':
      return mustChange(
        await db
          .from('trip_places')
          .update({ stay_id: change.stayId })
          .eq('trip_id', change.tripId)
          .eq('place_id', change.placeId)
          .select('place_id'),
        SAVE_FAILED,
      );
    case 'addItem':
      return must(
        await db.from('trip_items').insert({
          trip_id: change.tripId,
          place_id: change.placeId,
          activity_id: change.activityId,
          day: change.schedule?.day ?? null,
          slot: change.schedule?.slot ?? null,
          sort_order: change.sortOrder,
        }),
        SAVE_FAILED,
      );
    case 'updateItem':
      return mustChange(
        await db
          .from('trip_items')
          .update({
            day: change.schedule?.day ?? null,
            slot: change.schedule?.slot ?? null,
            sort_order: change.sortOrder,
          })
          .eq('trip_id', change.tripId)
          .eq('activity_id', change.activityId)
          .select('id'),
        SAVE_FAILED,
      );
    case 'removeItem':
      return mustChange(
        await db
          .from('trip_items')
          .delete()
          .eq('trip_id', change.tripId)
          .eq('activity_id', change.activityId)
          .select('id'),
        SAVE_FAILED,
      );
  }
}

/**
 * Trips stored in Supabase: the finished example of a Supabase service.
 * Not switched on until the migrations are applied (see services/trips/index.ts).
 */
export const liveTripService: TripService = {
  async load() {
    const rows = must(
      await getSupabase().from('trips').select(TRIP_SELECT).order('created_at'),
      "Your trips couldn't be loaded. Check your connection and try again.",
    );
    return rows.map(tripFromRows);
  },
  async apply(_userId, changes) {
    // In order: later changes can depend on earlier ones (a trip before its items).
    for (const change of changes) await applyOne(change);
  },
  newTripId: randomUUID,
};
