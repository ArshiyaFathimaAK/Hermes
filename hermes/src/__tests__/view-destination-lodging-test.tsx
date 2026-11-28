import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

// UC-06 View Destination / Lodging, driven through the whole app on the mock services.
//
// RL-TC01  a destination shows its own things to do, and a detail page for one of them
// RL-TC02  lodging asks for dates first, then lists each stay with the price for the whole trip

const open = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

it('RL-TC01: shows the things to do in the destination, and the full detail of one', async () => {
  await open('/place/lisbon');

  // Lisbon's things to do are listed, and Kyoto's are not.
  expect(await screen.findByTestId('activity-belem')).toBeTruthy();
  expect(screen.getByTestId('activity-market')).toBeTruthy();
  expect(screen.queryByTestId('activity-fushimi-inari')).toBeNull();

  await press('activity-belem');

  // Belém Tower has hours, an address, places close by, and a map link in its sample data.
  expect(await screen.findByTestId('activity-screen')).toBeTruthy();
  expect(await screen.findByText('10 AM – 5:30 PM')).toBeTruthy();
  expect(screen.getByText('Av. Brasília, 1400-038 Lisboa')).toBeTruthy();
  expect(screen.getByText('Close by')).toBeTruthy();
  expect(screen.getByText('LX Factory')).toBeTruthy();
  expect(screen.getByText('Open in Google Maps')).toBeTruthy();
});

it('RL-TC01 (missing data): a thing to do with no extra details hides what it does not have', async () => {
  // The viewpoint has no description, address, nearby places or website in the sample data.
  await open('/activity/miradouro');

  expect(await screen.findByTestId('activity-screen')).toBeTruthy();
  expect(await screen.findByText('Miradouro da Senhora do Monte')).toBeTruthy();
  // Hours fall back to the opening status; nothing is made up for the rest.
  expect(screen.getByText('Open 24 hours')).toBeTruthy();
  expect(screen.queryByText('About')).toBeNull();
  expect(screen.queryByText('Close by')).toBeNull();
  expect(screen.queryByText('Official website')).toBeNull();
});

it('RL-TC02: asks for dates, then shows each stay with the price for the whole trip', async () => {
  await open('/place/lisbon?view=stays');

  // Stay prices depend on the nights, so there are none until the person picks dates.
  expect(await screen.findByTestId('stays-need-dates')).toBeTruthy();
  expect(screen.queryByTestId('stay-river')).toBeNull();

  // "This weekend" is Friday to Sunday: 2 nights, whichever day the test runs on.
  await press('dates-chip');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  await press('save-dates');

  expect(await screen.findByTestId('stay-river')).toBeTruthy();
  expect(screen.queryByTestId('stays-need-dates')).toBeNull();
  // Only Lisbon's stays are listed, each at its nightly rate for 2 nights.
  expect(screen.getByTestId('stay-belem-house')).toBeTruthy();
  expect(screen.getByTestId('stay-chiado')).toBeTruthy();
  expect(screen.queryByTestId('stay-gion-inn')).toBeNull();
  expect(screen.getByText('$276')).toBeTruthy(); // Riverside apartment, $138 a night
  expect(screen.getByText('$192')).toBeTruthy(); // Guesthouse in Belém, $96 a night
  expect(screen.getByText('$370')).toBeTruthy(); // Boutique hotel in Chiado, $185 a night
  expect(screen.getAllByText(/for 2 nights/)).toHaveLength(3);
});
