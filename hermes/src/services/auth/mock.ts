import type { AuthService } from './contract';

export const DEMO_USER_ID = 'demo-user';

/** Checks nothing. Any email and password signs in to a new, empty account. */
export const mockAuthService: AuthService = {
  async signIn({ email }) {
    return { id: email.toLowerCase(), name: email.split('@')[0], email };
  },
  async signUp({ name, email }) {
    return { id: email.toLowerCase(), name, email };
  },
  async signInAsDemo() {
    return { id: DEMO_USER_ID, name: 'Demo Traveler', email: 'demo@example.com' };
  },
  async signOut() {},
};
