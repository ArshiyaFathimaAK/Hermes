/* eslint-disable @typescript-eslint/no-require-imports -- jest.isolateModules needs require() */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

it('explains what is missing when Supabase is not set up', () => {
  jest.isolateModules(() => {
    jest.doMock('@/config', () => ({ config: { supabaseUrl: '', supabasePublishableKey: '' } }));
    const { getSupabase, isSupabaseConfigured } = require('../supabase');
    expect(isSupabaseConfigured).toBe(false);
    expect(() => getSupabase()).toThrow('EXPO_PUBLIC_SUPABASE_URL');
  });
});

it('makes one client and reuses it', () => {
  jest.isolateModules(() => {
    jest.doMock('@/config', () => ({
      config: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'sb_publishable_test' },
    }));
    const { getSupabase } = require('../supabase');
    expect(getSupabase()).toBe(getSupabase());
  });
});
