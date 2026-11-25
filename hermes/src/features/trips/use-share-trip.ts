import { useState } from 'react';
import { Share } from 'react-native';

import type { Trip } from '@/domain/trip';
import { sharingService } from '@/services/sharing';
import { useAccountGate } from '@/state/session';

/** UC-12 Share Trip. */
export function useShareTrip(trip: Trip) {
  const gate = useAccountGate();
  const [link, setLink] = useState<{ token: string; url: string }>();
  const [error, setError] = useState<string>();

  const createLink = () =>
    gate('share-trip', async () => {
      setError(undefined);
      try {
        setLink(await sharingService.createLink(trip));
      } catch {
        setError('We could not make a share link. Try again.');
      }
    });

  async function send() {
    if (!link) return;
    try {
      await Share.share({ message: `${trip.name}: ${link.url}` });
    } catch {
      // Some browsers have no share menu.
      setError('Sharing is not available here. Copy the link instead.');
    }
  }

  return { link, error, createLink, send, close: () => setLink(undefined) };
}
