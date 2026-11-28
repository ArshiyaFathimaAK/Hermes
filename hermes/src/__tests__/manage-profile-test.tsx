import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { mockProfileService } from '@/services/profile/mock';

// UC-03 Manage Profile: loading, success and failure when editing a name.

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

async function openEditProfile() {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Account/));
  await press('edit-profile');
  return screen.findByDisplayValue('Demo Traveler');
}

async function typeAndSave(name: string) {
  await fireEvent.changeText(await openEditProfile(), name);
  await press('save-profile');
}

afterEach(() => jest.restoreAllMocks());

it('saves a new name and shows it on the account screen', async () => {
  await typeAndSave('  Ana Silva ');
  expect(await screen.findByText('Ana Silva')).toBeTruthy();
  expect(screen).toHavePathname('/account');
});

// While-saving behaviour is tested on the hook (features/account/__tests__/use-edit-profile-test.ts):
// a press here waits for the whole save, so the screen can't be checked halfway through.

it('keeps the form open with the error when saving fails', async () => {
  jest
    .spyOn(mockProfileService, 'updateName')
    .mockRejectedValue(new Error('Your name could not be saved. Try again.'));
  await typeAndSave('Ana');
  expect(await screen.findByText('Your name could not be saved. Try again.')).toBeTruthy();
  expect(screen).toHavePathname('/edit-profile');
  expect(screen.getByText('Save')).toBeTruthy();
});

it('asks for a name instead of saving an empty one', async () => {
  const update = jest.spyOn(mockProfileService, 'updateName');
  await typeAndSave('   ');
  expect(await screen.findByText('Enter your name.')).toBeTruthy();
  expect(update).not.toHaveBeenCalled();
});
