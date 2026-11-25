import { useState } from 'react';

import type { DateRange, IsoDate } from '@/domain/dates';
import { useDailyWeather } from '@/features/weather';
import { useTrips } from '@/state/trips';

/** Dates are optional and never need an account. */
export function useDatePicker(placeId: string) {
  const { datesForPlace, setPlaceDates } = useTrips();
  const [range, setRange] = useState<DateRange | undefined>(() => datesForPlace(placeId));
  // True after a first tap, until the last day is picked.
  const [pickingEnd, setPickingEnd] = useState(false);
  const forecast = useDailyWeather(placeId, range);

  function pickDay(date: IsoDate) {
    if (pickingEnd && range && date >= range.start) {
      setRange({ start: range.start, end: date });
      setPickingEnd(false);
    } else {
      setRange({ start: date, end: date });
      setPickingEnd(true);
    }
  }

  function pickRange(next: DateRange) {
    setRange(next);
    setPickingEnd(false);
  }

  return {
    range,
    pickDay,
    pickRange,
    forecast,
    save: () => {
      if (range) setPlaceDates(placeId, range);
    },
  };
}
