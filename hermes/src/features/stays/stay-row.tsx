import { View } from 'react-native';

import type { Stay } from '@/domain/stay';
import { createStyles, radius, sizes, spacing } from '@/theme';
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

/** Joins the parts that exist with " · ". Missing data is hidden, never filled in. */
const joined = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

export function StayRow({ stay, nights, chosen, onToggle }: StayRowProps) {
  const styles = useStyles();
  const kindAndArea = joined(stay.kind, stay.area);
  const reviews = joined(stay.scoreWord, stay.reviewCount && `${stay.reviewCount} reviews`);
  return (
    <View style={styles.row}>
      <View style={styles.photo}>
        <Icon name="bed" size={28} color="actionText" />
      </View>
      <View style={styles.body}>
        <Text variant="label" weight="bold">
          {stay.name}
        </Text>
        {kindAndArea !== '' && (
          <Text variant="caption" color="textSecondary">
            {kindAndArea}
          </Text>
        )}
        {(stay.score !== undefined || reviews !== '') && (
          <Text variant="caption" color="textSecondary">
            {stay.score !== undefined && (
              <Text variant="caption" weight="bold">
                {stay.score}{' '}
              </Text>
            )}
            {reviews}
          </Text>
        )}
        {stay.near && (
          <Text variant="caption" weight="semibold" color="actionText">
            {stay.near}
          </Text>
        )}
        {stay.nightly !== undefined && (
          <Text variant="caption" color="textSecondary">
            <Text variant="label" weight="extrabold">
              {formatMoney(stay.nightly * nights)}
            </Text>{' '}
            for {pluralize(nights, 'night')}
            {stay.freeCancellation ? ' · Free cancellation' : ''}
          </Text>
        )}
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

const useStyles = createStyles((colors) => ({
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
}));
