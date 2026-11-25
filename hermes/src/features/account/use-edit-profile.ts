import { useState } from 'react';

import { goBack } from '@/navigation/routes';
import { useSession } from '@/state/session';

/** UC-03 Manage Profile. Only the name for now. */
export function useEditProfile() {
  const { user, updateName } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await updateName(name.trim());
      goBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your name could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return { user, name, setName, error, busy, save };
}
