import { useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture } from 'react-native-gesture-handler';

import type { DateRange, IsoDate } from '@/domain/dates';
import { createStyles, sizes, spacing } from '@/theme';
import { IconButton } from '@/ui/icon-button';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';
import {
  addMonths,
  dayOfMonth,
  eachDay,
  firstOfMonth,
  formatLong,
  formatMonth,
  today,
  weekdayIndex,
} from '@/utils/dates';

import { dayAt, dragAnchor, lastOfMonth, orderedRange } from './month-grid';
import { RangeHighlight } from './range-highlight';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ROW_HEIGHT = sizes.touch + spacing.xxs;

interface CalendarProps {
  month: IsoDate;
  onChangeMonth: (month: IsoDate) => void;
  range?: DateRange;
  onPickDay: (date: IsoDate) => void;
  onDragRange: (range: DateRange) => void;
}

/** Tap the first and last day, or drag across them. Either end of a range can be dragged. */
export function Calendar({ month, onChangeMonth, range, onPickDay, onDragRange }: CalendarProps) {
  const styles = useStyles();
  const now = today();
  const [width, setWidth] = useState(0);
  const anchor = useRef<IsoDate>(undefined);
  // Browsers send a click to where a drag began. This tells it apart from a tap.
  const dragged = useRef(false);

  const days = eachDay({ start: month, end: lastOfMonth(month) });
  const blanks = Array.from({ length: weekdayIndex(month) }, (_, i) => i);

  type Point = { x: number; y: number };
  const dayUnder = (point: Point) => dayAt(month, point, { width, rowHeight: ROW_HEIGHT }, now);

  // From the first touch: a drag is only recognized once the finger has moved away from it.
  const startDrag = (event: Point) => {
    anchor.current = dragAnchor(range, dayUnder(event));
    dragged.current = false;
  };
  const continueDrag = (event: Point) => {
    if (!anchor.current) return;
    dragged.current = true;
    const next = orderedRange(anchor.current, dayUnder(event));
    if (next.start !== range?.start || next.end !== range?.end) onDragRange(next);
  };
  const endDrag = (event: Point & { canceled: boolean }) => {
    // A quick flick can end without an update.
    if (!event.canceled) continueDrag(event);
    anchor.current = undefined;
  };

  // Sideways starts right away. Up or down scrolls the page, unless you hold first.
  // Day picking is React state, so these run on the JS thread (disableReanimated).
  // The options are spelled out because the worklets compiler rejects spreads here.
  const sideways = usePanGesture({
    disableReanimated: true,
    enabled: width > 0,
    activeOffsetX: [-8, 8],
    failOffsetY: [-20, 20],
    onBegin: startDrag,
    onUpdate: continueDrag,
    onDeactivate: endDrag,
  });
  const afterHold = usePanGesture({
    disableReanimated: true,
    enabled: width > 0,
    activateAfterLongPress: 220,
    onBegin: startDrag,
    onUpdate: continueDrag,
    onDeactivate: endDrag,
  });
  const drag = useCompetingGestures(sideways, afterHold);

  return (
    <View>
      <View style={styles.header}>
        <Text variant="label" weight="bold" style={styles.month}>
          {formatMonth(month)}
        </Text>
        <IconButton
          icon="back"
          label="Previous month"
          disabled={month <= firstOfMonth(now)}
          onPress={() => onChangeMonth(addMonths(month, -1))}
        />
        <IconButton
          icon="chevronRight"
          label="Next month"
          onPress={() => onChangeMonth(addMonths(month, 1))}
        />
      </View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((weekday, i) => (
          <Text
            key={i}
            variant="caption"
            weight="semibold"
            color="textMuted"
            align="center"
            style={styles.cell}>
            {weekday}
          </Text>
        ))}
      </View>
      <GestureDetector gesture={drag} touchAction="pan-y">
        <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 && (
            // A new month starts fresh instead of gliding over from the last one.
            <RangeHighlight
              key={month}
              month={month}
              range={range}
              width={width}
              rowHeight={ROW_HEIGHT}
            />
          )}
          {blanks.map((i) => (
            <View key={i} style={styles.cell} />
          ))}
          {days.map((date) => {
            const isEnd = date === range?.start || date === range?.end;
            const inRange = range !== undefined && date >= range.start && date <= range.end;
            return (
              <Tappable
                key={date}
                testID={`day-${date}`}
                accessibilityLabel={formatLong(date)}
                accessibilityState={{ selected: inRange }}
                disabled={date < now}
                onPress={() => {
                  if (!dragged.current) onPickDay(date);
                }}
                style={[styles.cell, styles.day]}>
                <Text
                  variant="label"
                  weight={isEnd ? 'bold' : 'medium'}
                  color={isEnd ? 'onAction' : 'text'}>
                  {dayOfMonth(date)}
                </Text>
              </Tappable>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}

const useStyles = createStyles(() => ({
  header: { flexDirection: 'row', alignItems: 'center' },
  month: { flex: 1 },
  weekdays: { flexDirection: 'row', paddingBottom: spacing.xxs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%` },
  day: {
    height: sizes.touch,
    marginBottom: ROW_HEIGHT - sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
