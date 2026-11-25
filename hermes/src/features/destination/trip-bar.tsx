import { View } from 'react-native';

import type { Trip } from '@/domain/trip';
import { useShowTrips } from '@/navigation/use-show-trips';
import { useTrips } from '@/state/trips';
import { createStyles, radius, shadows, spacing } from '@/theme';
import { Badge } from '@/ui/badge';
import { Icon } from '@/ui/icon';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';
import { formatRange } from '@/utils/dates';
import { pluralize } from '@/utils/format';

/** Confirms saves and links to the plan. */
export function TripBar({ trip }: { trip: Trip }) {
  const styles = useStyles();
  const { selectTrip } = useTrips();
  const showTrips = useShowTrips();
  const count = trip.items.length;
  return (
    <View style={styles.position}>
      <Tappable
        testID="trip-bar"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Your ${trip.name} trip, ${pluralize(count, 'thing')} saved. View plan`}
        onPress={() => {
          selectTrip(trip.id);
          showTrips();
        }}
        style={styles.bar}>
        <Badge variant="primary" label={String(count)} style={styles.count} />
        <View style={styles.text}>
          <Text weight="bold" color="textOnFrame">
            Your {trip.name} trip
          </Text>
          <Text variant="caption" color="textOnFrameMuted">
            {pluralize(count, 'thing')} saved
            {trip.dates ? ` · ${formatRange(trip.dates)}` : ''}
          </Text>
        </View>
        <Text weight="bold" color="actionOnFrame">
          View plan
        </Text>
        <Icon name="chevronRight" size={16} color="actionOnFrame" />
      </Tappable>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  position: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.frame,
    ...shadows.high,
  },
  count: { alignSelf: 'center' },
  text: { flex: 1 },
}));
