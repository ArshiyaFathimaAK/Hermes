import type { SignInInput, SignUpInput } from '@/services/auth/contract';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Placeholder checks. UC-01 and UC-02 own the real rules and messages.

export function validateSignIn({ email, password }: SignInInput): FieldErrors<SignInInput> {
  const errors: FieldErrors<SignInInput> = {};
  if (!email.trim()) errors.email = 'This field is required.';
  if (!password) errors.password = 'This field is required.';
  return errors;
}

export function validateSignUp(input: SignUpInput): FieldErrors<SignUpInput> {
  const errors: FieldErrors<SignUpInput> = validateSignIn(input);
  if (!input.name.trim()) errors.name = 'This field is required.';
  return errors;
}
