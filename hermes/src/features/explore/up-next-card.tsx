import { View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { CONDITION_LABELS, useCurrentWeather } from '@/features/weather';
import { useShowTrips } from '@/navigation/use-show-trips';
import { useTemperature } from '@/state/preferences';
import { useTrips } from '@/state/trips';
import { createStyles, radius, sizes, spacing } from '@/theme';
import { Badge } from '@/ui/badge';
import { Icon } from '@/ui/icon';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';
import { formatCountdown, formatRange } from '@/utils/dates';
import { pluralize } from '@/utils/format';

export function UpNextCard({ trip }: { trip: Trip }) {
  const styles = useStyles();
  const { selectTrip } = useTrips();
  const showTrips = useShowTrips();
  const weather = useCurrentWeather(trip.placeIds[0]);
  const formatTemp = useTemperature();

  return (
    <Tappable
      testID="up-next"
      accessibilityLabel={`Open your ${trip.name} trip`}
      onPress={() => {
        selectTrip(trip.id);
        showTrips();
      }}
      style={styles.card}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text variant="title" color="textOnFrame">
            {trip.name}
          </Text>
          <Text color="textOnFrameMuted">
            {trip.dates ? formatRange(trip.dates) : 'No dates yet'}
          </Text>
        </View>
        {trip.dates && <Badge variant="primary" label={formatCountdown(trip.dates.start)} />}
      </View>
      <View style={styles.footer}>
        {weather.status === 'ready' && (
          <View style={styles.weather}>
            <Icon name={weather.data.condition} size={18} color="actionOnFrame" />
            <Text weight="semibold" color="textOnFrame">
              {formatTemp(weather.data.temperature)} {CONDITION_LABELS[weather.data.condition]}
            </Text>
          </View>
        )}
        <Text weight="semibold" color="textOnFrameMuted" style={styles.text}>
          {pluralize(trip.items.length, 'thing')} saved
        </Text>
        <Icon name="chevronRight" color="textOnFrame" />
      </View>
    </Tappable>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.frame,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  text: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.frameBorder,
  },
  weather: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
}));
