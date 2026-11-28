import { getSupabase, mustChange } from '@/services/supabase';

import type { ProfileService } from './contract';
import { PROFILE_SELECT, userWithProfile } from './rows';

/**
 * UC-03 on Supabase (`profiles`). Needs a real login (UC-01/02): row level security only lets
 * people change their own row, so the demo account can't save here.
 */
export const liveProfileService: ProfileService = {
  async updateName(user, name) {
    const [row] = mustChange(
      await getSupabase()
        .from('profiles')
        .update({ display_name: name })
        .eq('id', user.id)
        .select(PROFILE_SELECT),
      'Your name could not be saved. Try again.',
    );
    return userWithProfile(user, row);
  },
};
