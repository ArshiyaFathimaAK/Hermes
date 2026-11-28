/** App-wide switches. */
export const config = {
  /** Shows "Skip with a demo account" on the sign-in screen. Turn off once UC-01/UC-02 are real. */
  demoSignIn: true,
  shareBaseUrl: 'hermes://shared/',
  /**
   * The Python server in /server. Set EXPO_PUBLIC_API_URL in .env.local (see .env.example).
   * Expo only fills this in when it is written exactly like this.
   */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
  /** Both are safe to ship in the app. Set in .env (see .env.example). */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
};
