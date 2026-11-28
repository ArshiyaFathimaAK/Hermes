import type { User } from '@/domain/user';
import type { Database } from '@/services/database.types';

type ProfileRow = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'display_name'>;

/** The profile columns the app reads. */
export const PROFILE_SELECT = 'id, display_name';

/** A stored profile on top of the signed-in user. Email stays with Supabase Auth. */
export function userWithProfile(user: User, row: ProfileRow): User {
  return { ...user, name: row.display_name };
}
