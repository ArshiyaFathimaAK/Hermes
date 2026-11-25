import type { PropsWithChildren } from 'react';

import { PreferencesProvider } from './preferences';
import { SessionProvider } from './session';
import { TripsProvider } from './trips';

/** Everything screens may rely on. Used by the root layout and by tests. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PreferencesProvider>
      <SessionProvider>
        <TripsProvider>{children}</TripsProvider>
      </SessionProvider>
    </PreferencesProvider>
  );
}
