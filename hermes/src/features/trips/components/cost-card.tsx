import { useCallback } from 'react';

import type { Trip } from '@/domain/trip';
import { costService } from '@/services/costs';
import { AsyncView } from '@/ui/async-view';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';
import { formatMoney, pluralize } from '@/utils/format';
import { useAsync } from '@/utils/use-async';

/** UC-11 View Estimated Trip Cost. */
export function CostCard({ trip }: { trip: Trip }) {
  const estimate = useAsync(useCallback(() => costService.estimate(trip), [trip]));
  return (
    <Section title="Estimated cost" tone="strong">
      <AsyncView state={estimate}>
        {({ lodging, activities, total, unpriced }) => (
          <>
            <ListGroup>
              <ListRow title="Places to stay" value={formatMoney(lodging)} />
              <ListRow title="Things to do" value={formatMoney(activities)} />
              <ListRow
                title="Total"
                testID="trip-cost-total"
                trailing={<Text variant="subheading">{formatMoney(total)}</Text>}
              />
            </ListGroup>
            <Text variant="caption" color="textMuted">
              A rough estimate using sample prices.
              {unpriced > 0 ? ` ${pluralize(unpriced, 'thing')} without a price not included.` : ''}
            </Text>
          </>
        )}
      </AsyncView>
    </Section>
  );
}
