import { useRef, useState } from 'react';

import { goBack } from '@/navigation/routes';
import { useSession } from '@/state/session';

import { validateName } from './validation';

/** UC-03 Manage Profile. Only the name for now. */
export function useEditProfile() {
  const { user, updateName } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // State updates late, so pressing Return and Save together could otherwise save twice.
  const saving = useRef(false);

  async function save() {
    if (saving.current) return;
    const problem = validateName(name);
    if (problem) {
      setError(problem);
      return;
    }
    const trimmed = name.trim();
    if (trimmed === user?.name) {
      goBack();
      return;
    }
    saving.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await updateName(trimmed);
      goBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your name could not be saved.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return { user, name, setName, error, busy, save };
}
