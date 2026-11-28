import { router } from 'expo-router';

import { routes } from '@/navigation/routes';

import { ACCOUNT_ACTIONS, type AccountAction } from './access';
import { useSession } from './session-provider';

/** Runs the action, or opens sign-in when it needs an account and there isn't one. */
export function useAccountGate() {
  const { user } = useSession();
  return (action: AccountAction, run: () => void) => {
    if (!user && ACCOUNT_ACTIONS.includes(action)) router.push(routes.signIn);
    else run();
  };
}
