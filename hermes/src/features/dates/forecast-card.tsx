import { ScrollView, View } from 'react-native';

import type { DateRange } from '@/domain/dates';
import type { DailyWeather } from '@/domain/weather';
import { useTemperature } from '@/state/preferences';
import { createStyles, radius, spacing } from '@/theme';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import { daysBetween, formatRange, formatWeekday } from '@/utils/dates';
import { pluralize } from '@/utils/format';

/** UC-07 View Weather. */
export function ForecastCard({ range, days }: { range: DateRange; days: DailyWeather[] }) {
  const styles = useStyles();
  const formatTemp = useTemperature();
  const anyTypical = days.some((day) => day.isTypical);
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text weight="bold" style={styles.fill}>
          {formatRange(range)}
        </Text>
        <Text variant="caption" weight="semibold" color="textMuted">
          {pluralize(daysBetween(range.start, range.end) + 1, 'day')}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {days.map((day) => (
          <View key={day.date} style={styles.day}>
            <Text variant="caption" weight="semibold" color="textMuted">
              {formatWeekday(day.date)}
            </Text>
            <Icon name={day.condition} />
            <Text weight="bold">{formatTemp(day.high)}</Text>
            <Text variant="caption" color="textMuted">
              {formatTemp(day.low)}
            </Text>
            {day.isTypical && (
              <Text variant="micro" color="textMuted">
                Typical
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
      <Text variant="caption" color="textSecondary">
        {anyTypical
          ? 'Days more than 16 days out show typical weather from past years, not a forecast.'
          : 'Forecast. It updates every day until you go.'}
      </Text>
      <Text variant="micro" color="textMuted">
        Weather data by Open-Meteo
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSoft,
  },
  heading: { flexDirection: 'row', alignItems: 'baseline' },
  fill: { flex: 1 },
  days: { gap: spacing.md },
  day: { alignItems: 'center', gap: spacing.xs, minWidth: 42 },
}));
