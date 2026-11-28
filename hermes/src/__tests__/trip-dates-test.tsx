import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { addDays, formatRange, today } from '@/utils/dates';

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

async function openTrips() {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
}

// The sample trip starts in 9 days. "This weekend" always differs from it.
async function pickThisWeekend() {
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  await press('save-dates');
}

it('changes dates from inside the trip and comes back to it', async () => {
  await openTrips();
  const before = formatRange({ start: addDays(today(), 9), end: addDays(today(), 13) });
  expect(await screen.findByText(before)).toBeTruthy();
  await press('trip-dates');
  await pickThisWeekend();
  expect(screen).toHavePathname('/trips');
  expect(screen.queryByText(before)).toBeNull();
  // Plans on days that still exist stay put.
  expect(await screen.findByTestId('plan-belem')).toBeTruthy();
});

it('changes only the trip being shown when two include the place', async () => {
  await openTrips();
  await press('new-trip');
  await press('pick-lisbon');
  await fireEvent.press(await screen.findByLabelText('Add dates to plan by day'));
  await pickThisWeekend();
  expect(await screen.findByRole('header', { name: 'Lisbon 2' })).toBeTruthy();
  await press('trip-trip-lisbon');
  const original = formatRange({ start: addDays(today(), 9), end: addDays(today(), 13) });
  expect(await screen.findByText(original)).toBeTruthy();
});
