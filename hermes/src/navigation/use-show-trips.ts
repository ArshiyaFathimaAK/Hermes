import { router, useNavigationContainerRef } from 'expo-router';

import { routes } from './routes';

interface StackState {
  key?: string;
  index?: number;
  routes: { name: string; state?: StackState }[];
}

/** Finds an open navigator by its route name, at any depth. */
function findStack(state: StackState | undefined, name: string): StackState | undefined {
  for (const route of state?.routes ?? []) {
    if (route.name === name) return route.state;
    const nested = findStack(route.state, name);
    if (nested) return nested;
  }
  return undefined;
}

/** Shows the plan itself, closing any place that was open on top of it in the Trips tab. */
export function useShowTrips() {
  const navigation = useNavigationContainerRef();
  return () => {
    const stack = findStack(navigation.getRootState() as StackState | undefined, '(trips)');
    // Only when something is open: navigators log an error if there is nothing to close.
    if (stack?.key && stack.routes.length > 1) {
      navigation.dispatch({ type: 'POP_TO_TOP', target: stack.key });
    }
    router.navigate(routes.trips);
  };
}
