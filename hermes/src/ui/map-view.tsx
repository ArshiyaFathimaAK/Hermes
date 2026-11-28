import { View } from 'react-native';

import { createStyles, radius, shadows, sizes, spacing } from '@/theme';

import { Icon } from './icon';
import { Tappable } from './tappable';
import { Text } from './text';

export interface MapPin {
  id: string;
  label: string;
  /** Shown on the pin. Without it the pin is a plain marker. */
  text?: string;
  /** Fraction (0-1) of the map's width and height. */
  position: { x: number; y: number };
  selected?: boolean;
  onPress?: () => void;
}

interface MapViewProps {
  height: number;
  pins: MapPin[];
}

/** Placeholder. Replace the inside of this file with a real map. */
export function MapView({ height, pins }: MapViewProps) {
  const styles = useStyles();
  return (
    <View style={[styles.map, { height }]}>
      <View style={styles.water} />
      <View style={styles.road} />
      <View style={styles.street} />
      {pins.map((pin) => (
        <Tappable
          key={pin.id}
          accessibilityLabel={pin.label}
          accessibilityState={{ selected: pin.selected }}
          disabled={false}
          onPress={pin.onPress}
          hitSlop={spacing.sm}
          style={[
            styles.pin,
            pin.text ? styles.textPin : styles.marker,
            pin.selected && styles.selectedPin,
            { left: `${pin.position.x * 100}%`, top: `${pin.position.y * 100}%` },
          ]}>
          {pin.text ? (
            <Text variant="caption" weight="bold" color={pin.selected ? 'onAction' : 'text'}>
              {pin.text}
            </Text>
          ) : (
            <Icon name="pin" size={18} color="onAction" />
          )}
        </Tappable>
      ))}
      <Text variant="micro" color="textMuted" style={styles.credit}>
        Map placeholder
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  map: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.mapLand },
  water: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -30,
    height: 70,
    backgroundColor: colors.mapWater,
    transform: [{ rotate: '-4deg' }],
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '36%',
    height: 3,
    backgroundColor: colors.mapRoad,
  },
  street: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: '45%',
    width: 3,
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: '16deg' }],
  },
  pin: { position: 'absolute', borderRadius: radius.pill, ...shadows.medium },
  textPin: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.text,
    backgroundColor: colors.raised,
    transform: [{ translateX: '-50%' }],
  },
  marker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.onAction,
    backgroundColor: colors.action,
    transform: [{ translateX: '-50%' }],
  },
  selectedPin: { borderColor: colors.action, backgroundColor: colors.action },
  credit: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.raised,
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
  },
}));
