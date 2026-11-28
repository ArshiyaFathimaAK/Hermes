import type { Activity } from '@/domain/activity';
import { DAY_SLOTS, type DaySlot, type Trip, type TripItem } from '@/domain/trip';
import { daysBetween } from '@/utils/dates';

import type { PlanEntry, PlanOptions } from './contract';

/*
 * The planning rules, for the mock. The same rules as the server's
 * server/hermes_api/features/itinerary/rules.py, which also checks and completes the AI's plans:
 * change both, and keep their tests in step.
 *
 * - Things that already have a day stay where they are.
 * - Every saved thing without a day gets one.
 * - The days are split between the trip's places, in order.
 * - A saved thing goes in an empty slot on the least busy of its place's days, in the slot that
 *   suits it: tours and sights in the morning, food in the evening.
 * - Suggestions go only in empty slots, on days with fewer than 2 things: one per day in turn, the
 *   best rated first.
 */

export const MAX_DAYS = 30;
export const MAX_PLACES = 10;
export const MAX_ITEMS = 200;
/** Suggestions go only on days with fewer things than this. */
export const SUGGEST_UNTIL = 2;

const SLOT_PREFERENCE: Record<string, readonly DaySlot[]> = {
  tours: ['morning', 'afternoon', 'evening'],
  sights: ['morning', 'afternoon', 'evening'],
  food: ['evening', 'afternoon', 'morning'],
};

/** What the server's POST /itinerary/generate takes. */
export interface PlanRequest {
  placeIds: string[];
  /** Days in the trip, both ends included. 0 when it has no dates. */
  dayCount: number;
  items: TripItem[];
  addSuggestions: boolean;
}

export function planRequestFor(trip: Trip, options?: PlanOptions): PlanRequest {
  return {
    placeIds: trip.placeIds,
    dayCount: trip.dates ? daysBetween(trip.dates.start, trip.dates.end) + 1 : 0,
    items: trip.items,
    addSuggestions: options?.addSuggestions ?? true,
  };
}

/** Throws an Error people can read when the trip can't be planned. */
export function checkRequest(request: PlanRequest) {
  if (request.placeIds.length === 0) throw new Error('Add a place to the trip first.');
  if (request.placeIds.length > MAX_PLACES) {
    throw new Error(`Plans can be made for up to ${MAX_PLACES} places at a time.`);
  }
  if (request.dayCount < 1) throw new Error('Pick dates for the trip first.');
  if (request.dayCount > MAX_DAYS) {
    throw new Error(`Plans can be made for trips of up to ${MAX_DAYS} days.`);
  }
  if (request.items.length > MAX_ITEMS) {
    throw new Error('That trip has too many things to plan at once.');
  }
}

/** The things to do that a plan may use. */
export interface Catalog {
  /** Each of the trip's places, with its things to do in the service's order. */
  byPlace: Map<string, Activity[]>;
  /** Every known thing to do by id, saved ones included. */
  byId: Map<string, Activity>;
}

/** How many things are in each slot of each day so far. */
class Board {
  private counts = new Map<string, number>();

  count = (day: number, slot: DaySlot) => this.counts.get(`${day}:${slot}`) ?? 0;
  isEmpty = (day: number, slot: DaySlot) => this.count(day, slot) === 0;
  load = (day: number) => DAY_SLOTS.reduce((sum, slot) => sum + this.count(day, slot), 0);
  add = (day: number, slot: DaySlot) =>
    this.counts.set(`${day}:${slot}`, this.count(day, slot) + 1);
}

/** Splits the days between the places, in order. With more places than days, places share. */
export function placeDays(placeIds: string[], dayCount: number): Map<string, number[]> {
  const places = [...new Set(placeIds)];
  const days = new Map<string, number[]>();
  places.forEach((placeId, index) => {
    const start = Math.floor((index * dayCount) / places.length);
    const end = Math.floor(((index + 1) * dayCount) / places.length);
    const range = Array.from({ length: end - start }, (_, i) => start + i);
    days.set(placeId, range.length > 0 ? range : [Math.min(start, dayCount - 1)]);
  });
  return days;
}

/** The place for each day: the first one that has it. */
function dayPlaces(placeIds: string[], dayCount: number): string[] {
  const owners: (string | undefined)[] = Array.from({ length: dayCount });
  for (const [placeId, days] of placeDays(placeIds, dayCount)) {
    for (const day of days) owners[day] ??= placeId;
  }
  return owners.map((owner) => owner ?? placeIds[0]);
}

const isPlaced = (item: TripItem, dayCount: number) =>
  item.schedule !== undefined && item.schedule.day >= 0 && item.schedule.day < dayCount;

const preference = (activity: Activity) => SLOT_PREFERENCE[activity.category] ?? DAY_SLOTS;

/** Compares two lists of numbers, first difference wins: Python's tuple order. */
function compare(a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function minBy<T>(options: T[], key: (option: T) => number[]): T | undefined {
  return options.reduce<T | undefined>(
    (best, option) => (best === undefined || compare(key(option), key(best)) < 0 ? option : best),
    undefined,
  );
}

function startingBoard(request: PlanRequest) {
  const board = new Board();
  for (const item of request.items) {
    if (item.schedule && isPlaced(item, request.dayCount)) {
      board.add(item.schedule.day, item.schedule.slot);
    }
  }
  return board;
}

function planSaved(request: PlanRequest, catalog: Catalog, board: Board): PlanEntry[] {
  const daysFor = placeDays(request.placeIds, request.dayCount);
  const everyDay = Array.from({ length: request.dayCount }, (_, day) => day);
  const seen = new Set<string>();
  const entries: PlanEntry[] = [];
  for (const item of request.items) {
    const activity = catalog.byId.get(item.activityId);
    if (!activity || seen.has(item.activityId) || isPlaced(item, request.dayCount)) continue;
    seen.add(item.activityId);
    const slots = preference(activity);
    const spots = (daysFor.get(item.placeId) ?? everyDay).flatMap((day) =>
      slots.map((slot) => ({ day, slot })),
    );
    // An empty slot on the least busy day, then the earliest day, then the slot that suits it.
    const { day, slot } = minBy(spots, (spot) => [
      board.isEmpty(spot.day, spot.slot) ? 0 : 1,
      board.load(spot.day),
      spot.day,
      slots.indexOf(spot.slot),
    ])!;
    board.add(day, slot);
    entries.push({
      activityId: item.activityId,
      placeId: item.placeId,
      schedule: { day, slot },
      suggested: false,
    });
  }
  return entries;
}

function suggest(
  request: PlanRequest,
  catalog: Catalog,
  board: Board,
  used: Set<string>,
): PlanEntry[] {
  if (!request.addSuggestions) return [];
  const owners = dayPlaces(request.placeIds, request.dayCount);
  const entries: PlanEntry[] = [];
  let added = true;
  while (added) {
    added = false;
    for (let day = 0; day < request.dayCount; day++) {
      if (board.load(day) >= SUGGEST_UNTIL) continue;
      const options = (catalog.byPlace.get(owners[day]) ?? []).flatMap((activity, index) =>
        used.has(activity.id)
          ? []
          : DAY_SLOTS.filter((slot) => board.isEmpty(day, slot)).map((slot) => ({
              activity,
              index,
              slot,
            })),
      );
      const best = minBy(options, ({ activity, index, slot }) => [
        preference(activity).indexOf(slot),
        -(activity.rating ?? 0),
        index,
        DAY_SLOTS.indexOf(slot),
      ]);
      if (!best) continue;
      board.add(day, best.slot);
      used.add(best.activity.id);
      entries.push({
        activityId: best.activity.id,
        placeId: owners[day],
        schedule: { day, slot: best.slot },
        suggested: true,
      });
      added = true;
    }
  }
  return entries;
}

export function planWithRules(request: PlanRequest, catalog: Catalog): PlanEntry[] {
  const board = startingBoard(request);
  const saved = planSaved(request, catalog, board);
  const used = new Set(request.items.map((item) => item.activityId));
  return [...saved, ...suggest(request, catalog, board, used)];
}
