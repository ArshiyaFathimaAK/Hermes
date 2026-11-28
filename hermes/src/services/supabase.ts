import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { config } from '@/config';

import type { Database } from './database.types';

export type HermesSupabase = SupabaseClient<Database>;

let client: HermesSupabase | undefined;

/** False until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set. */
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey);

/**
 * The one Supabase client. Only live services use it (services/<name>/live.ts), never screens.
 * Made on first use, so the app still runs on mocks without any Supabase settings.
 */
export function getSupabase(): HermesSupabase {
  if (!isSupabaseConfigured) {
    throw new Error(
      __DEV__
        ? 'Supabase is not set up. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env, then restart Expo.'
        : "Can't connect right now. Try again later.",
    );
  }
  if (!client) {
    client = createClient<Database>(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        // On phones the login is kept in AsyncStorage; web browsers use their own storage.
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
    // Keep the login fresh only while the app is open, as Supabase recommends.
    if (Platform.OS !== 'web') {
      AppState.addEventListener('change', (state) => {
        if (state === 'active') client?.auth.startAutoRefresh();
        else client?.auth.stopAutoRefresh();
      });
    }
  }
  return client;
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Supabase returns errors instead of throwing them, so they're easy to miss.
 * Wrap every call: `const trips = must(await supabase.from('trips').select())`.
 * Throws an Error people can read; the details go to the console during development.
 */
export function must<T>(result: QueryResult<T>, failure = 'Something went wrong. Try again.'): T {
  if (result.error) {
    if (__DEV__) console.warn('Supabase:', result.error.code, result.error.message);
    throw new Error(failure);
  }
  return result.data as T;
}

/**
 * For update and delete. When row level security hides a row, Supabase changes nothing and still
 * reports success. Add `.select()` to the call so this can check a row really changed.
 */
export function mustChange<T>(
  result: QueryResult<T[]>,
  failure = 'That change could not be saved.',
) {
  const rows = must(result, failure);
  if (rows.length === 0) {
    if (__DEV__) console.warn('Supabase: no row changed. Missing, or hidden by a policy?');
    throw new Error(failure);
  }
  return rows;
}
