import { useState } from 'react';

import type { DateRange, IsoDate } from '@/domain/dates';
import { useDailyWeather } from '@/features/weather';
import { useTrips } from '@/state/trips';
import { firstOfMonth, today } from '@/utils/dates';

/** Dates are optional and never need an account. */
export function useDatePicker(placeId: string) {
  const { datesForPlace, setPlaceDates } = useTrips();
  const [range, setRange] = useState<DateRange | undefined>(() => datesForPlace(placeId));
  const [month, setMonth] = useState(() => firstOfMonth(range?.start ?? today()));
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

  function dragRange(next: DateRange) {
    setRange(next);
    setPickingEnd(false);
  }

  /** Also turns to the month it starts in. */
  function pickPreset(next: DateRange) {
    dragRange(next);
    setMonth(firstOfMonth(next.start));
  }

  return {
    month,
    setMonth,
    range,
    pickDay,
    dragRange,
    pickPreset,
    forecast,
    save: () => {
      if (range) setPlaceDates(placeId, range);
    },
  };
}
