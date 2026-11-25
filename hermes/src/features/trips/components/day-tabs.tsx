import { ScrollView, StyleSheet } from 'react-native';

import type { IsoDate } from '@/domain/dates';
import type { DailyWeather } from '@/domain/weather';
import { useTemperature } from '@/state/preferences';
import { colors, radius, sizes, spacing } from '@/theme';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';
import { dayOfMonth, formatLong, formatWeekday } from '@/utils/dates';

interface DayTabsProps {
  days: IsoDate[];
  weather: DailyWeather[];
  selected: number;
  onSelect: (day: number) => void;
}

export function DayTabs({ days, weather, selected, onSelect }: DayTabsProps) {
  const formatTemp = useTemperature();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {days.map((date, day) => {
        const isSelected = day === selected;
        const color = isSelected ? 'textOnInverse' : 'text';
        return (
          <Tappable
            key={date}
            testID={`day-tab-${day}`}
            accessibilityRole="tab"
            accessibilityLabel={formatLong(date)}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(day)}
            style={[styles.tab, isSelected && styles.selected]}>
            <Text variant="caption" weight="semibold" color={color}>
              {formatWeekday(date)}
            </Text>
            <Text variant="subheading" color={color}>
              {dayOfMonth(date)}
            </Text>
            {weather[day] && (
              <Text variant="caption" weight="semibold" color={color}>
                {formatTemp(weather[day].high)}
              </Text>
            )}
          </Tappable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginHorizontal: -spacing.xl },
  row: { flexGrow: 1, gap: spacing.sm, paddingHorizontal: spacing.xl },
  tab: {
    flexGrow: 1,
    minWidth: 58,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.inverse, borderColor: colors.inverse },
});
