/** Actions that need an account. Searching, browsing, weather and dates never do. */
export const ACCOUNT_ACTIONS = ['save-to-trip', 'share-trip', 'edit-profile'] as const;

export type AccountAction = (typeof ACCOUNT_ACTIONS)[number];
