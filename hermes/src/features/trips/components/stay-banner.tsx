import { StyleSheet, View } from 'react-native';

import type { Place } from '@/domain/place';
import type { Stay } from '@/domain/stay';
import { colors, radius, spacing } from '@/theme';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

interface StayBannerProps {
  place: Place;
  stay?: Stay;
  /** Says which place it is for, when a trip has several. */
  showPlace: boolean;
  onPress?: () => void;
}

export function StayBanner({ place, stay, showPlace, onPress }: StayBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.icon}>
        <Icon name="bed" color="actionOnInverse" />
      </View>
      <View style={styles.text}>
        <Text variant="caption" color="textOnInverseMuted">
          {showPlace ? `Stay in ${place.name}` : "Where you're staying"}
        </Text>
        <Text variant="label" weight="bold" color="textOnInverse">
          {stay?.name ?? 'Not chosen yet'}
        </Text>
      </View>
      {onPress && (
        <Button
          variant="plainOnInverse"
          label={stay ? 'Change' : 'Find a stay'}
          onPress={onPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.inverse,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.inverseSurface,
  },
  text: { flex: 1, gap: spacing.xxs },
});
