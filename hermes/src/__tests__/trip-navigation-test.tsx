import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));
const pressLabel = async (label: string | RegExp) =>
  fireEvent.press(await screen.findByLabelText(label));

async function openTrips() {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  await pressLabel(/^Trips/);
  await screen.findByTestId('new-trip');
}

it('goes back to the trip after opening one of its places', async () => {
  await openTrips();
  await press('add-place');
  await press('pick-kyoto');
  await press('trip-place-kyoto');
  expect(screen).toHavePathname('/place/kyoto');
  expect(screen).toHaveSegments(['(tabs)', '(trips)', 'place', '[placeId]']);
  await pressLabel('Back');
  expect(screen).toHavePathname('/trips');
});

it('goes back to the trip after looking for a stay', async () => {
  await openTrips();
  await pressLabel('Find a stay');
  expect(screen).toHavePathname('/place/lisbon');
  await pressLabel('Back');
  expect(screen).toHavePathname('/trips');
});

it('closes the place when its trip bar is pressed', async () => {
  await openTrips();
  await pressLabel('Find a stay');
  await press('trip-bar');
  expect(screen).toHavePathname('/trips');
  const stacked = { includeHiddenElements: true };
  expect(screen.queryByTestId('destination-screen', stacked)).toBeNull();
  expect(screen.getAllByTestId('trips-screen', stacked)).toHaveLength(1);
});

it('goes back to Explore from a place opened there', async () => {
  await renderRouter('./src/app', { initialUrl: '/' });
  await fireEvent.changeText(await screen.findByTestId('place-search'), 'Kyo');
  await press('place-kyoto');
  expect(screen).toHaveSegments(['(tabs)', '(explore)', 'place', '[placeId]']);
  await pressLabel('Back');
  expect(screen).toHavePathname('/');
});

it('opens the trip from a place in Explore', async () => {
  await renderRouter('./src/app', { initialUrl: '/place/lisbon' });
  await press('save-miradouro');
  await press('demo-sign-in');
  await press('trip-bar');
  expect(screen).toHavePathname('/trips');
  expect(await screen.findByTestId('new-trip')).toBeTruthy();
});

it('shows the plan from Explore even when a place was left open in Trips', async () => {
  await openTrips();
  await pressLabel('Find a stay');
  await pressLabel(/^Explore/);
  await press('up-next');
  expect(screen).toHavePathname('/trips');
  expect(screen.getAllByTestId('trips-screen', { includeHiddenElements: true })).toHaveLength(1);
});

// jest.setup.ts fails these if the navigator is asked for something it cannot do.
describe('View plan', () => {
  it('from Explore, before Trips was ever opened', async () => {
    await renderRouter('./src/app', { initialUrl: '/place/lisbon' });
    await press('save-miradouro');
    await press('demo-sign-in');
    await press('trip-bar');
    expect(await screen.findByTestId('new-trip')).toBeTruthy();
  });

  it('from Explore, with only the plan open in Trips', async () => {
    await openTrips();
    await pressLabel(/^Explore/);
    await press('up-next');
    expect(await screen.findByTestId('new-trip')).toBeTruthy();
  });

  it('from Account', async () => {
    await renderRouter('./src/app', { initialUrl: '/sign-in' });
    await press('demo-sign-in');
    await pressLabel(/^Account/);
    await fireEvent.press(await screen.findByText('Your trips'));
    expect(await screen.findByTestId('new-trip')).toBeTruthy();
  });

  it('from a place inside Trips', async () => {
    await openTrips();
    await pressLabel('Find a stay');
    await press('trip-bar');
    expect(await screen.findByTestId('new-trip')).toBeTruthy();
  });
});

it('closes a screen opened from a link onto Explore', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('continue-as-guest');
  expect(await screen.findByTestId('explore-screen')).toBeTruthy();
});
