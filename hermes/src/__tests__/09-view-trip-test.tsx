import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { addDays, formatCountdown, formatRange, today } from '@/utils/dates';

// UC-09 View Saved Trips, TC-09-01. Runs on the mock services; the sample trip is Lisbon,
// starting in 9 days, with belem (morning), lxf (afternoon) and market (evening) on day 1.

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

it('TC-09-01: shows a signed-in user their saved trip and its day plan', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));

  const start = addDays(today(), 9);
  const range = { start, end: addDays(today(), 13) };

  expect(await screen.findByTestId('trips-screen')).toBeTruthy();
  expect(await screen.findByRole('header', { name: 'Lisbon' })).toBeTruthy();
  expect(await screen.findByText(formatRange(range))).toBeTruthy();
  expect(screen.getByText(formatCountdown(start))).toBeTruthy();

  // Day 1 holds one saved activity in each time of day.
  expect(await screen.findByTestId('plan-belem')).toBeTruthy();
  expect(screen.getByTestId('plan-lxf')).toBeTruthy();
  expect(screen.getByTestId('plan-market')).toBeTruthy();
  expect(screen.getByText('Morning')).toBeTruthy();
  expect(screen.getByText('Afternoon')).toBeTruthy();
  expect(screen.getByText('Evening')).toBeTruthy();

  // A trip that has things saved is not an empty trip, and a signed-in user is not a guest.
  expect(screen.queryByText('Nothing saved yet')).toBeNull();
  expect(screen.queryByTestId('no-trips')).toBeNull();
  expect(screen.queryByTestId('guest-trips')).toBeNull();
});
