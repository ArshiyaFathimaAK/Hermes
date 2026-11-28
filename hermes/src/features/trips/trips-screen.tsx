import { router } from 'expo-router';

import { routes } from '@/navigation/routes';
import { useSession } from '@/state/session';
import { useTrips } from '@/state/trips';
import { AsyncView } from '@/ui/async-view';
import { Message } from '@/ui/message';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

import { TripTabs } from './components/trip-tabs';
import { TripView } from './trip-view';

export function TripsScreen() {
  const { user } = useSession();
  const { state, trips, activeTrip, selectTrip } = useTrips();
  const startTrip = () => router.push(routes.newTrip);

  return (
    <Screen testID="trips-screen">
      <AsyncView state={state}>
        {() =>
          activeTrip ? (
            <>
              <TripTabs
                trips={trips}
                activeId={activeTrip.id}
                onSelect={selectTrip}
                onNew={startTrip}
              />
              <TripView key={activeTrip.id} trip={activeTrip} />
            </>
          ) : (
            <>
              <Text variant="title" accessibilityRole="header">
                Trips
              </Text>
              {user ? (
                <Message
                  testID="no-trips"
                  title="No trips yet"
                  body="Pick a place to start one, or save something to do while you explore."
                  action={{ label: 'New trip', onPress: startTrip }}
                />
              ) : (
                <Message
                  testID="guest-trips"
                  title="Sign in to plan trips"
                  body="You can search, browse and check the weather without an account."
                  action={{ label: 'Sign in', onPress: () => router.push(routes.signIn) }}
                />
              )}
            </>
          )
        }
      </AsyncView>
    </Screen>
  );
}
