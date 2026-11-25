import { createContext, use, useState, type PropsWithChildren } from 'react';

import type { User } from '@/domain/user';
import { authService } from '@/services/auth';
import type { SignInInput, SignUpInput } from '@/services/auth/contract';
import { profileService } from '@/services/profile';

interface Session {
  /** Null means the person is browsing as a guest. */
  user: User | null;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const session: Session = {
    user,
    signIn: async (input) => setUser(await authService.signIn(input)),
    signUp: async (input) => setUser(await authService.signUp(input)),
    signInAsDemo: async () => setUser(await authService.signInAsDemo()),
    signOut: async () => {
      await authService.signOut();
      setUser(null);
    },
    updateName: async (name) => {
      if (user) setUser(await profileService.updateName(user, name));
    },
  };

  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession() {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
