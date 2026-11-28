import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { tripService } from '@/services/trips';

// UC-10 Manage Trips, TC-10-01. Runs on the mock services; the sample trip is Lisbon (trip-lisbon).

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

it('TC-10-01: deletes a trip only after the person confirms', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
  expect(await screen.findByTestId('plan-belem')).toBeTruthy();

  // Asking, then choosing "Keep trip", changes nothing.
  await press('delete-trip');
  await fireEvent.press(await screen.findByLabelText('Keep trip'));
  expect(await screen.findByTestId('plan-belem')).toBeTruthy();
  expect(screen.queryByTestId('no-trips')).toBeNull();
  expect(await tripService.load('demo-user')).toHaveLength(1);

  // Confirming removes the trip from the screen and from storage.
  await press('delete-trip');
  await press('confirm-delete-trip');
  expect(await screen.findByTestId('no-trips')).toBeTruthy();
  expect(screen.queryByTestId('plan-belem')).toBeNull();
  await waitFor(async () => {
    expect(await tripService.load('demo-user')).toEqual([]);
  });
});
