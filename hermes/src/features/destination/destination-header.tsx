import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DateRange } from '@/domain/dates';
import type { Place } from '@/domain/place';
import { CONDITION_LABELS, summarizeDays, useCurrentWeather, useDailyWeather } from '@/features/weather';
import { goBack, routes } from '@/navigation/routes';
import { useTemperature } from '@/state/preferences';
import { createStyles, spacing } from '@/theme';
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
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const weather = useWeatherChip(place.id, dates);
  const openDates = () => router.push(routes.dates(place.id));

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {/* The frame is dark in both modes. */}
      {isFocused && <StatusBar style="light" />}
      <IconButton
        icon="back"
        variant="onFrame"
        label="Back"
        onPress={goBack}
        style={styles.back}
      />
      <View>
        <Text variant="hero" color="textOnFrame" accessibilityRole="header">
          {place.name}
        </Text>
        <Text color="textOnFrameMuted">{place.region}</Text>
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
            variant="onFrame"
            icon={weather.icon}
            iconColor="actionOnFrame"
            label={weather.label}
            accessibilityLabel={`Weather: ${weather.label}. Open dates and forecast`}
            onPress={openDates}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  header: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.frame,
  },
  back: { marginLeft: -spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
}));
