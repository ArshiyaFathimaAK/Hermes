import type { Trip } from '@/domain/trip';
import { config } from '@/config';

import type { SharedTrip, SharingService } from './contract';

const shared = new Map<string, SharedTrip>();

function toSharedTrip({ name, placeIds, dates, items, stayIds }: Trip): SharedTrip {
  return { name, placeIds, dates, items, stayIds };
}

/** Demo tokens are guessable and links only work until the app restarts. */
export const mockSharingService: SharingService = {
  async createLink(trip) {
    const token = `demo-${trip.id}`;
    shared.set(token, toSharedTrip(trip));
    return { token, url: `${config.shareBaseUrl}${token}` };
  },
  async view(token) {
    const trip = shared.get(token);
    if (!trip) throw new Error('This share link is not valid.');
    return trip;
  },
};
