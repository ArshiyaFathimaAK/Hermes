import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

// The whole app on mock services. Copy this shape for a screen or use case test.
const open = (initialUrl = '/') => renderRouter('./src/app', { initialUrl });

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

it('lets a guest search and open a place', async () => {
  await open();
  await fireEvent.changeText(await screen.findByTestId('place-search'), 'Lis');
  await press('place-lisbon');
  expect(await screen.findByTestId('activity-belem')).toBeTruthy();
});

it('asks a guest to sign in before saving, and lets them skip', async () => {
  await open('/place/lisbon');
  await press('save-belem');
  expect(await screen.findByTestId('sign-in-screen')).toBeTruthy();
  await press('continue-as-guest');
  expect(screen).toHavePathname('/place/lisbon');
});

it('saves with the demo account', async () => {
  await open('/place/lisbon');
  await press('save-miradouro');
  await press('demo-sign-in');
  await press('save-miradouro');
  expect(await screen.findByLabelText(/4 things saved/)).toBeTruthy();
});

it('asks for dates before showing stay prices', async () => {
  await open('/place/lisbon?view=stays');
  expect(await screen.findByTestId('stays-need-dates')).toBeTruthy();
});

it('shows an error for a share link that does not exist', async () => {
  await open('/shared/nope');
  expect(await screen.findByText('This share link is not valid.')).toBeTruthy();
});

it('applies filters and closes the sheet', async () => {
  await open('/place/lisbon');
  await press('open-filters');
  expect(screen.queryByText('Open now')).toBeNull();
  await fireEvent.press(await screen.findByLabelText('More options'));
  await fireEvent.press(await screen.findByLabelText('Open now'));
  await fireEvent.press(await screen.findByLabelText('Show 4 results'));
  expect(screen.queryByLabelText('Clear all')).toBeNull();
  expect(screen.queryByTestId('activity-sintra')).toBeNull();
  expect(screen.getByTestId('activity-belem')).toBeTruthy();
});
