import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

it('starts a second trip to the same place, separate from the first', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
  await press('new-trip');
  await fireEvent.changeText(await screen.findByTestId('pick-place-search'), 'Lis');
  await press('pick-lisbon');

  expect(await screen.findByRole('header', { name: 'Lisbon 2' })).toBeTruthy();
  expect(screen.getByText('Nothing saved yet')).toBeTruthy();

  await press('trip-trip-lisbon');
  expect(await screen.findByTestId('plan-belem')).toBeTruthy();
});

it('deletes a trip after asking', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
  await press('delete-trip');
  await press('confirm-delete-trip');
  expect(await screen.findByTestId('no-trips')).toBeTruthy();
});
