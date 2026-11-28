import type { User } from '@/domain/user';

/** UC-03 Manage Profile. Only the name can be edited for now. */
export interface ProfileService {
  updateName(user: User, name: string): Promise<User>;
}
