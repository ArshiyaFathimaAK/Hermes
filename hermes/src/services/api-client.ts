import { config } from '@/config';

/** How long to wait for the server before showing an error. */
const TIMEOUT_MS = 10_000;

type Query = Record<string, string | number | undefined>;

/**
 * Calls the Python server in /server. Live services use this; screens never do.
 * Rejects with an Error whose message can be shown to people, so AsyncView can display it.
 */
export async function apiRequest<T>(
  path: string,
  { query, body }: { query?: Query; body?: unknown } = {},
): Promise<T> {
  // Built by hand: React Native's URL class doesn't support searchParams.
  const search = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const url = `${config.apiUrl.replace(/\/$/, '')}${path}${search ? `?${search}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new Error(
      __DEV__
        ? `Can't reach the server at ${config.apiUrl}. Is it running, and is EXPO_PUBLIC_API_URL right?`
        : "Can't connect right now. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }

  const data: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Something went wrong. Try again.';
    throw new Error(message);
  }
  return data as T;
}

export const apiGet = <T>(path: string, query?: Query) => apiRequest<T>(path, { query });
export const apiPost = <T>(path: string, body: unknown) => apiRequest<T>(path, { body });
