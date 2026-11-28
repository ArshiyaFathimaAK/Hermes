import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import type { DateRange, IsoDate } from '@/domain/dates';
import { createStyles, radius, sizes } from '@/theme';
import { springs } from '@/ui/motion';

import { cellOf, lastOfMonth, weekSpans } from './month-grid';

interface RangeHighlightProps {
  month: IsoDate;
  range?: DateRange;
  width: number;
  rowHeight: number;
}

/** Draws the chosen days behind the numbers, gliding as they change. */
export function RangeHighlight({ month, range, width, rowHeight }: RangeHighlightProps) {
  const styles = useStyles();
  const cell = width / 7;
  const last = lastOfMonth(month);
  const inMonth = (date?: IsoDate) =>
    date !== undefined && date >= month && date <= last ? cellOf(month, date) : undefined;

  return (
    <View pointerEvents="none" style={styles.layer}>
      {weekSpans(month, range).map((span, row) => (
        <Bar
          key={row}
          top={row * rowHeight}
          left={(span?.from ?? 0) * cell}
          width={span ? (span.to - span.from + 1) * cell : 0}
        />
      ))}
      <Thumb position={inMonth(range?.start)} cell={cell} rowHeight={rowHeight} />
      <Thumb position={inMonth(range?.end)} cell={cell} rowHeight={rowHeight} />
    </View>
  );
}

function Bar({ top, left, width }: { top: number; left: number; width: number }) {
  const styles = useStyles();
  const animated = useAnimatedStyle(() => ({
    left: withTiming(left, { duration: 120 }),
    width: withTiming(width, { duration: 120 }),
  }));
  return <Animated.View style={[styles.bar, { top }, animated]} />;
}

interface ThumbProps {
  position?: { row: number; column: number };
  cell: number;
  rowHeight: number;
}

function Thumb({ position, cell, rowHeight }: ThumbProps) {
  const styles = useStyles();
  const x = (position?.column ?? 0) * cell;
  const y = (position?.row ?? 0) * rowHeight;
  const visible = position !== undefined;
  const animated = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 100 }),
    transform: [
      { translateX: withSpring(x, springs.follow) },
      { translateY: withSpring(y, springs.follow) },
    ],
  }));
  return <Animated.View style={[styles.thumb, { width: cell }, animated]} />;
}

const useStyles = createStyles((colors) => ({
  layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  bar: {
    position: 'absolute',
    height: sizes.touch,
    borderRadius: radius.md,
    backgroundColor: colors.actionSoft,
  },
  thumb: {
    position: 'absolute',
    height: sizes.touch,
    borderRadius: radius.md,
    backgroundColor: colors.action,
  },
}));
