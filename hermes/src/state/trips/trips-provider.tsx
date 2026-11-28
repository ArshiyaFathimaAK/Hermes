import {
  createContext,
  use,
  useCallback,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { DateRange } from '@/domain/dates';
import type { Trip, TripSchedule } from '@/domain/trip';
import { tripService } from '@/services/trips';
import { diffTrips } from '@/services/trips/changes';
import { useSession } from '@/state/session';
import { today } from '@/utils/dates';
import { useAsync, type AsyncState } from '@/utils/use-async';

import * as logic from './trip-logic';

interface TripsStore {
  /** Guests always have an empty, ready list. */
  state: AsyncState<Trip[]>;
  /** Soonest first. */
  trips: Trip[];
  activeTrip?: Trip;
  selectTrip: (tripId: string) => void;
  tripForPlace: (placeId: string) => Trip | undefined;
  datesForPlace: (placeId: string) => DateRange | undefined;
  /** Whether it is in the trip that saves for this place go to. */
  isSaved: (placeId: string, activityId: string) => boolean;
  /** Starts a new trip and makes it the active one. */
  createTrip: (place: logic.PlaceRef) => void;
  deleteTrip: (tripId: string) => void;
  removeItem: (tripId: string, activityId: string) => void;
  toggleActivity: (place: logic.PlaceRef, activityId: string) => void;
  toggleStay: (place: logic.PlaceRef, stayId: string) => void;
  setPlaceDates: (placeId: string, dates: DateRange) => void;
  addPlace: (tripId: string, placeId: string) => void;
  scheduleItem: (tripId: string, activityId: string, schedule?: TripSchedule) => void;
  moveItem: (tripId: string, activityId: string, by: -1 | 1) => void;
  /** Set when the last save failed. */
  saveError?: string;
}

const TripsContext = createContext<TripsStore | null>(null);

const NO_TRIPS: Trip[] = [];

export function TripsProvider({ children }: PropsWithChildren) {
  const { user } = useSession();
  const userId = user?.id;

  // Bumped to load again from storage, after a save fails.
  const [loadCount, setLoadCount] = useState(0);
  const load = useCallback(
    () => (userId ? tripService.load(userId) : Promise.resolve(NO_TRIPS)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCount only forces a reload
    [userId, loadCount],
  );
  const loaded = useAsync(load);

  const [edited, setEdited] = useState<{ userId: string; trips: Trip[] }>();
  const [activeTripId, setActiveTripId] = useState<string>();
  // Dates picked before a trip exists, so guests can check the weather too.
  const [draftDates, setDraftDates] = useState<Record<string, DateRange>>({});
  const [saveError, setSaveError] = useState<string>();
  // Saves run one after another, so storage receives changes in the order they were made.
  const saving = useRef<Promise<void>>(Promise.resolve());

  const hasEdits = edited !== undefined && edited.userId === userId;
  const state: AsyncState<Trip[]> = !userId
    ? { status: 'ready', data: NO_TRIPS }
    : hasEdits
      ? { status: 'ready', data: edited.trips }
      : loaded;
  const trips = state.status === 'ready' ? logic.sortTrips(state.data, today()) : NO_TRIPS;

  function commit(next: Trip[]) {
    // Never save over trips that haven't loaded yet.
    if (!userId || state.status !== 'ready') return;
    const changes = diffTrips(state.data, next);
    if (changes.length === 0) return;
    setEdited({ userId, trips: next });
    setSaveError(undefined);
    saving.current = saving.current.then(() =>
      tripService.apply(userId, changes).catch(() => {
        // What's stored may now differ from the screen, so show what's really stored.
        setSaveError('Your last change could not be saved.');
        setEdited(undefined);
        setLoadCount((count) => count + 1);
      }),
    );
  }

  const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? trips[0];
  const tripForPlace = (placeId: string) =>
    logic.findTripForPlace(trips, placeId, activeTrip?.id);
  const datesForPlace = (placeId: string) => {
    const trip = tripForPlace(placeId);
    return trip ? trip.dates : draftDates[placeId];
  };

  const store: TripsStore = {
    state,
    trips,
    activeTrip,
    selectTrip: setActiveTripId,
    tripForPlace,
    datesForPlace,
    isSaved: (placeId, activityId) => logic.isActivitySaved(tripForPlace(placeId), activityId),
    createTrip: (place) => {
      const next = logic.createTrip(trips, place, undefined, tripService.newTripId);
      commit(next);
      setActiveTripId(next[next.length - 1].id);
    },
    deleteTrip: (tripId) => {
      commit(logic.deleteTrip(trips, tripId));
      if (activeTrip?.id === tripId) setActiveTripId(undefined);
    },
    removeItem: (tripId, activityId) => commit(logic.removeItem(trips, tripId, activityId)),
    toggleActivity: (place, activityId) =>
      commit(
        logic.toggleActivity(
          trips,
          place,
          activityId,
          draftDates[place.id],
          activeTrip?.id,
          tripService.newTripId,
        ),
      ),
    toggleStay: (place, stayId) =>
      commit(
        logic.toggleStay(
          trips,
          place,
          stayId,
          draftDates[place.id],
          activeTrip?.id,
          tripService.newTripId,
        ),
      ),
    setPlaceDates: (placeId, dates) => {
      const trip = tripForPlace(placeId);
      if (trip) commit(logic.setDates(trips, trip.id, dates));
      else setDraftDates((drafts) => ({ ...drafts, [placeId]: dates }));
    },
    addPlace: (tripId, placeId) => commit(logic.addPlace(trips, tripId, placeId)),
    scheduleItem: (tripId, activityId, schedule) =>
      commit(logic.scheduleItem(trips, tripId, activityId, schedule)),
    moveItem: (tripId, activityId, by) =>
      commit(logic.moveItem(trips, tripId, activityId, by)),
    saveError,
  };

  return <TripsContext value={store}>{children}</TripsContext>;
}

export function useTrips() {
  const store = use(TripsContext);
  if (!store) throw new Error('useTrips must be used inside TripsProvider');
  return store;
}
