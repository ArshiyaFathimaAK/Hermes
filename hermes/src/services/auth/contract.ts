import type { User } from '@/domain/user';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  name: string;
}

/**
 * UC-01 Create Account, UC-02 Log In.
 * Reject with an Error whose message can be shown to the user.
 */
export interface AuthService {
  signIn(input: SignInInput): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  /** Temporary: see config.demoSignIn. */
  signInAsDemo(): Promise<User>;
  signOut(): Promise<void>;
  /** Who is signed in now, or null. Called when the app starts: a login lasts across restarts. */
  currentUser(): Promise<User | null>;
  /**
   * Calls `listener` whenever sign-in changes outside the app's own buttons, such as a login
   * expiring. Returns a function that stops listening.
   */
  onUserChange(listener: (user: User | null) => void): () => void;
}
