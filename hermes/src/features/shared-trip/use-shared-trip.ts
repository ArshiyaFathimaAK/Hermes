import { useCallback } from 'react';

import { sharingService } from '@/services/sharing';
import { useAsync } from '@/utils/use-async';

/** UC-12: opening a share link. Needs no account. */
export function useSharedTrip(token: string) {
  return useAsync(useCallback(() => sharingService.view(token), [token]));
}
