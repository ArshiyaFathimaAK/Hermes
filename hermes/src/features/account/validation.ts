/** Matches the check on profiles.display_name in the database. */
export const MAX_NAME_LENGTH = 80;

/** UC-03: what's wrong with a new name, or undefined when it can be saved. */
export function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter your name.';
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return undefined;
}
