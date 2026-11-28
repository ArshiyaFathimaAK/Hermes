import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

// Generate AI Itinerary, through the whole app. Tests use the mock, which plans with the rules.

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

async function openDemoTrip() {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
  await screen.findByTestId('plan-days');
}

it('plans the demo trip, says how, and shows the suggestions on their days', async () => {
  await openDemoTrip();
  await press('plan-days');
  expect(await screen.findByText('Planned with simple rules: 3 suggestions added.')).toBeTruthy();
  await press('day-tab-1');
  expect(await screen.findByTestId('plan-alfama')).toBeTruthy();
  await press('day-tab-2');
  expect(await screen.findByTestId('plan-sintra')).toBeTruthy();
});

it('adds nothing the second time, once the free days are planned', async () => {
  await openDemoTrip();
  await press('plan-days');
  await screen.findByText('Planned with simple rules: 3 suggestions added.');
  await press('plan-days');
  expect(await screen.findByText('Nothing to add: everything already has a day.')).toBeTruthy();
});
