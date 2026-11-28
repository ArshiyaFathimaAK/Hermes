import { View } from 'react-native';

import type { Place } from '@/domain/place';
import type { Stay } from '@/domain/stay';
import { createStyles, radius, spacing } from '@/theme';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { Tappable } from '@/ui/tappable';
import { Text } from '@/ui/text';

interface StayBannerProps {
  place: Place;
  stay?: Stay;
  /** Says which place it is for, when a trip has several. */
  showPlace: boolean;
  onPress?: () => void;
  /** Opens the chosen stay's own screen. Only used when there is a stay. */
  onOpen?: () => void;
}

export function StayBanner({ place, stay, showPlace, onPress, onOpen }: StayBannerProps) {
  const styles = useStyles();
  const open = stay ? onOpen : undefined;
  return (
    <View style={styles.banner}>
      <Tappable
        testID={stay ? `open-stay-${stay.id}` : undefined}
        accessibilityRole={open ? 'button' : undefined}
        accessibilityLabel={stay && open ? `${stay.name}, details` : undefined}
        disabled={!open}
        onPress={open}
        style={styles.open}>
      <View style={styles.icon}>
        <Icon name="bed" color="actionOnFrame" />
      </View>
      <View style={styles.text}>
        <Text variant="caption" color="textOnFrameMuted">
          {showPlace ? `Stay in ${place.name}` : "Where you're staying"}
        </Text>
        <Text variant="label" weight="bold" color="textOnFrame">
          {stay?.name ?? 'Not chosen yet'}
        </Text>
      </View>
      </Tappable>
      {onPress && (
        <Button
          variant="plainOnFrame"
          label={stay ? 'Change' : 'Find a stay'}
          onPress={onPress}
        />
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.frame,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.frameSurface,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: spacing.xxs },
}));
