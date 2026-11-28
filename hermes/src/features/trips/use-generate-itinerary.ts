import { useEffect, useRef, useState } from 'react';

import type { Trip } from '@/domain/trip';
import type { ItineraryPlan } from '@/services/itinerary/contract';
import { itineraryService } from '@/services/itinerary';
import { useTrips } from '@/state/trips';
import { pluralize } from '@/utils/format';

/** What to tell people once a plan is in. Says honestly whether the AI or the rules made it. */
export function summarizePlan({ source, entries }: ItineraryPlan) {
  if (entries.length === 0) return 'Nothing to add: everything already has a day.';
  const suggested = entries.filter((entry) => entry.suggested).length;
  const saved = entries.length - suggested;
  const parts = [
    saved > 0 && `${pluralize(saved, 'saved thing')} put on a day`,
    suggested > 0 && `${pluralize(suggested, 'suggestion')} added`,
  ].filter(Boolean);
  const by = source === 'ai' ? 'Planned by AI' : 'Planned with simple rules';
  return `${by}: ${parts.join(', ')}.`;
}

/** Generate AI Itinerary: plans the trip's days and saves the plan to the trip. */
export function useGenerateItinerary(trip: Trip) {
  const trips = useTrips();
  // The plan arrives later: apply it to the trips as they are then, not as they were on the tap.
  const latest = useRef(trips);
  useEffect(() => {
    latest.current = trips;
  });
  const [isPlanning, setPlanning] = useState(false);
  const [summary, setSummary] = useState<string>();
  const [error, setError] = useState<string>();

  async function planDays() {
    if (isPlanning) return;
    setPlanning(true);
    setSummary(undefined);
    setError(undefined);
    try {
      const plan = await itineraryService.generate(trip);
      latest.current.applyPlan(trip.id, plan.entries);
      setSummary(summarizePlan(plan));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'We could not plan your days. Try again.',
      );
    } finally {
      setPlanning(false);
    }
  }

  return { planDays, isPlanning, summary, error };
}
