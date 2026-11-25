import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DateRange, IsoDate } from '@/domain/dates';
import { colors, radius, sizes, spacing } from '@/theme';
import { IconButton } from '@/ui/icon-button';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';
import {
  addDays,
  addMonths,
  dayOfMonth,
  eachDay,
  firstOfMonth,
  formatLong,
  formatMonth,
  today,
  weekdayIndex,
} from '@/utils/dates';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarProps {
  range?: DateRange;
  onPickDay: (date: IsoDate) => void;
}

export function Calendar({ range, onPickDay }: CalendarProps) {
  const now = today();
  const [month, setMonth] = useState(() => firstOfMonth(range?.start ?? now));
  const days = eachDay({ start: month, end: addDays(addMonths(month, 1), -1) });
  const blanks = Array.from({ length: weekdayIndex(month) }, (_, i) => i);

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
          onPress={() => setMonth(addMonths(month, -1))}
        />
        <IconButton
          icon="chevronRight"
          label="Next month"
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>
      <View style={styles.grid}>
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
        {blanks.map((i) => (
          <View key={i} style={styles.cell} />
        ))}
        {days.map((date) => {
          const isEnd = date === range?.start || date === range?.end;
          const inRange = range !== undefined && date > range.start && date < range.end;
          return (
            <Tappable
              key={date}
              testID={`day-${date}`}
              accessibilityLabel={formatLong(date)}
              accessibilityState={{ selected: isEnd || inRange }}
              disabled={date < now}
              onPress={() => onPickDay(date)}
              style={[styles.cell, styles.day, inRange && styles.inRange, isEnd && styles.end]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  month: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xxs },
  cell: { width: `${100 / 7}%` },
  day: { height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  inRange: { backgroundColor: colors.actionSoft },
  end: { backgroundColor: colors.action, borderRadius: radius.md },
});
