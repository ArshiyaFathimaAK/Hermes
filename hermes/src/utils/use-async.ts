import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; data: T };

type Settled<T> =
  | { load: unknown; attempt: number; data: T }
  | { load: unknown; attempt: number; error: string };

/**
 * Runs an async loader and reports loading / error / ready.
 * Wrap `load` in `useCallback`: a new function means "load again".
 */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>();
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setSettled({ load, attempt, data }),
      (reason: unknown) =>
        current &&
        setSettled({
          load,
          attempt,
          error: reason instanceof Error ? reason.message : 'Something went wrong.',
        }),
    );
    return () => {
      current = false;
    };
  }, [load, attempt]);

  if (!settled || settled.load !== load || settled.attempt !== attempt) {
    return { status: 'loading' };
  }
  if ('error' in settled) return { status: 'error', message: settled.error, retry };
  return { status: 'ready', data: settled.data };
}
