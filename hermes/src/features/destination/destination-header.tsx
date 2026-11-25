import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DateRange } from '@/domain/dates';
import type { Place } from '@/domain/place';
import { CONDITION_LABELS, summarizeDays, useCurrentWeather, useDailyWeather } from '@/features/weather';
import { goBack, routes } from '@/navigation/routes';
import { useTemperature } from '@/state/preferences';
import { colors, spacing } from '@/theme';
import { Chip } from '@/ui/chip';
import { IconButton } from '@/ui/icon-button';
import { Text } from '@/ui/text';
import { formatRange } from '@/utils/dates';

/** Today's weather, or the trip's forecast once there are dates. */
function useWeatherChip(placeId: string, dates?: DateRange) {
  const current = useCurrentWeather(placeId);
  const daily = useDailyWeather(placeId, dates);
  const formatTemp = useTemperature();

  const summary = daily.status === 'ready' ? summarizeDays(daily.data) : undefined;
  if (dates && summary) {
    const range =
      summary.min === summary.max
        ? formatTemp(summary.min)
        : `${formatTemp(summary.min).replace('°', '')}–${formatTemp(summary.max)}`;
    return { icon: summary.condition, label: `${range} ${CONDITION_LABELS[summary.condition]}` };
  }
  if (current.status !== 'ready') return undefined;
  const { condition, temperature } = current.data;
  return { icon: condition, label: `${formatTemp(temperature)} ${CONDITION_LABELS[condition]} now` };
}

export function DestinationHeader({ place, dates }: { place: Place; dates?: DateRange }) {
  const insets = useSafeAreaInsets();
  const weather = useWeatherChip(place.id, dates);
  const openDates = () => router.push(routes.dates(place.id));

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <IconButton
        icon="back"
        variant="onInverse"
        label="Back"
        onPress={goBack}
        style={styles.back}
      />
      <View>
        <Text variant="hero" color="textOnInverse" accessibilityRole="header">
          {place.name}
        </Text>
        <Text color="textOnInverseMuted">{place.region}</Text>
      </View>
      <View style={styles.chips}>
        <Chip
          testID="dates-chip"
          variant="primary"
          icon="calendar"
          label={dates ? formatRange(dates) : 'Add dates'}
          onPress={openDates}
        />
        {weather && (
          <Chip
            variant="inverse"
            icon={weather.icon}
            iconColor="actionOnInverse"
            label={weather.label}
            accessibilityLabel={`Weather: ${weather.label}. Open dates and forecast`}
            onPress={openDates}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.inverse,
  },
  back: { marginLeft: -spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
