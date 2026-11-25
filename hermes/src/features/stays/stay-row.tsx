import { StyleSheet, View } from 'react-native';

import type { Stay } from '@/domain/stay';
import { colors, radius, sizes, spacing } from '@/theme';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { Text } from '@/ui/text';
import { formatMoney, pluralize } from '@/utils/format';

interface StayRowProps {
  stay: Stay;
  nights: number;
  chosen: boolean;
  onToggle: () => void;
}

export function StayRow({ stay, nights, chosen, onToggle }: StayRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.photo}>
        <Icon name="bed" size={28} color="action" />
      </View>
      <View style={styles.body}>
        <Text variant="label" weight="bold">
          {stay.name}
        </Text>
        <Text variant="caption" color="textSecondary">
          {stay.kind} · {stay.area}
        </Text>
        <Text variant="caption" color="textSecondary">
          <Text variant="caption" weight="bold">
            {stay.score}
          </Text>{' '}
          {stay.scoreWord} · {stay.reviewCount} reviews
        </Text>
        <Text variant="caption" weight="semibold" color="action">
          {stay.near}
        </Text>
        <Text variant="caption" color="textSecondary">
          <Text variant="label" weight="extrabold">
            {formatMoney(stay.nightly * nights)}
          </Text>{' '}
          for {pluralize(nights, 'night')}
          {stay.freeCancellation ? ' · Free cancellation' : ''}
        </Text>
      </View>
      <IconButton
        testID={`stay-${stay.id}`}
        icon={chosen ? 'check' : 'add'}
        variant={chosen ? 'primary' : 'outline'}
        selected={chosen}
        label={chosen ? `Remove ${stay.name} from trip` : `Use ${stay.name} for this trip`}
        onPress={onToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.borderSubtle,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionSoft,
  },
  body: { flex: 1, gap: spacing.xs },
});
