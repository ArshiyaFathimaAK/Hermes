import { act, renderHook } from '@testing-library/react-native';

import { useEditProfile } from '../use-edit-profile';

// UC-03 while a save is on its way: the Save button says so, and a second press is ignored.

const mockGoBack = jest.fn();
jest.mock('@/navigation/routes', () => ({
  ...jest.requireActual('@/navigation/routes'),
  goBack: () => mockGoBack(),
}));

let finish: () => void;
let fail: (error: Error) => void;
const mockUpdateName = jest.fn(
  () =>
    new Promise<void>((resolve, reject) => {
      finish = resolve;
      fail = reject;
    }),
);
jest.mock('@/state/session', () => ({
  useSession: () => ({
    user: { id: 'u1', name: 'Demo Traveler', email: 'demo@example.com' },
    updateName: mockUpdateName,
  }),
}));

beforeEach(() => {
  mockGoBack.mockClear();
  mockUpdateName.mockClear();
});

async function startSaving(name: string) {
  const hook = await renderHook(useEditProfile);
  await act(async () => hook.result.current.setName(name));
  // Not awaited: the save stays open until the test finishes or fails it.
  await act(async () => void hook.result.current.save());
  return hook;
}

it('is busy while saving, saves once, then goes back', async () => {
  const { result } = await startSaving('Ana');
  expect(result.current.busy).toBe(true);
  await act(async () => void result.current.save());
  expect(mockUpdateName).toHaveBeenCalledTimes(1);
  expect(mockUpdateName).toHaveBeenCalledWith('Ana');
  await act(async () => finish());
  expect(result.current.busy).toBe(false);
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

it('stops being busy and shows why when saving fails', async () => {
  const { result } = await startSaving('Ana');
  await act(async () => fail(new Error('Your name could not be saved. Try again.')));
  expect(result.current.busy).toBe(false);
  expect(result.current.error).toBe('Your name could not be saved. Try again.');
  expect(mockGoBack).not.toHaveBeenCalled();
});

it('just closes when the name did not change', async () => {
  const { result } = await renderHook(useEditProfile);
  await act(async () => result.current.save());
  expect(mockUpdateName).not.toHaveBeenCalled();
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});
