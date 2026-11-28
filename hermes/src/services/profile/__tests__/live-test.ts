import { liveProfileService } from '../live';

// Stand in for Supabase: record the query and answer with `result`.
let result: { data: unknown; error: { message: string } | null };
const calls: Record<string, unknown[]> = {};
const query = {
  update: (...args: unknown[]) => ((calls.update = args), query),
  eq: (...args: unknown[]) => ((calls.eq = args), query),
  select: (...args: unknown[]) => ((calls.select = args), Promise.resolve(result)),
};
const mockFrom = jest.fn(() => query);

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/services/supabase', () => ({
  ...jest.requireActual('@/services/supabase'),
  getSupabase: () => ({ from: mockFrom }),
}));

const user = { id: 'u1', name: 'Old', email: 'a@example.com' };

beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => {}));

it('saves the name to the signed-in person’s profile', async () => {
  result = { data: [{ id: 'u1', display_name: 'New' }], error: null };
  await expect(liveProfileService.updateName(user, 'New')).resolves.toEqual({
    ...user,
    name: 'New',
  });
  expect(mockFrom).toHaveBeenCalledWith('profiles');
  expect(calls.update).toEqual([{ display_name: 'New' }]);
  expect(calls.eq).toEqual(['id', 'u1']);
});

it('fails with a readable message when Supabase returns an error', async () => {
  result = { data: null, error: { message: 'violates check constraint' } };
  await expect(liveProfileService.updateName(user, 'New')).rejects.toThrow(
    'Your name could not be saved. Try again.',
  );
});

it('fails when no row changed, such as when a policy hides it', async () => {
  result = { data: [], error: null };
  await expect(liveProfileService.updateName(user, 'New')).rejects.toThrow(
    'Your name could not be saved. Try again.',
  );
});
