import { useState } from 'react';

import type { Trip } from '@/domain/trip';
import { useTrips } from '@/state/trips';
import { BottomSheet } from '@/ui/bottom-sheet';
import { Button } from '@/ui/button';

export function DeleteTrip({ trip }: { trip: Trip }) {
  const { deleteTrip } = useTrips();
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button
        testID="delete-trip"
        variant="plain"
        label="Delete this trip"
        onPress={() => setAsking(true)}
      />
      <BottomSheet
        visible={asking}
        title={`Delete ${trip.name}?`}
        subtitle="Everything saved in it goes too. This can't be undone."
        onClose={() => setAsking(false)}
        footer={
          <>
            <Button
              testID="confirm-delete-trip"
              label="Delete trip"
              onPress={() => {
                setAsking(false);
                deleteTrip(trip.id);
              }}
            />
            <Button variant="quiet" label="Keep trip" onPress={() => setAsking(false)} />
          </>
        }
      />
    </>
  );
}
