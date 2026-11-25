import { router } from 'expo-router';
import { useState } from 'react';

import { goBack } from '@/navigation/routes';
import type { SignUpInput } from '@/services/auth/contract';
import { useSession } from '@/state/session';

import { validateSignIn, validateSignUp, type FieldErrors } from './validation';

/** UC-01 Create Account, UC-02 Log In. */
export function useAuthForm(mode: 'sign-in' | 'sign-up') {
  const session = useSession();
  const [values, setValues] = useState<SignUpInput>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<SignUpInput>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setFormError(undefined);
    try {
      await action();
      goBack();
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const found = mode === 'sign-in' ? validateSignIn(values) : validateSignUp(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    run(() =>
      mode === 'sign-in'
        ? session.signIn({ email: values.email.trim(), password: values.password })
        : session.signUp({ ...values, email: values.email.trim(), name: values.name.trim() }),
    );
  }

  return {
    values,
    errors,
    formError,
    busy,
    submit,
    setField: (field: keyof SignUpInput, value: string) =>
      setValues((current) => ({ ...current, [field]: value })),
    signInAsDemo: () => run(session.signInAsDemo),
    continueAsGuest: goBack,
    // Replace, so going back never bounces between the two forms.
    switchTo: router.replace,
  };
}
