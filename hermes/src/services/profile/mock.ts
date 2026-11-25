import type { ProfileService } from './contract';

export const mockProfileService: ProfileService = {
  async updateName(user, name) {
    return { ...user, name };
  },
};
