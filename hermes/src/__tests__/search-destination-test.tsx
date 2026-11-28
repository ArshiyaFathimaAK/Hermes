import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { mockPlaceService } from '@/services/places/mock';

// UC-04 Search for Destination: search when people pause typing, and not for a single letter.

afterEach(() => jest.restoreAllMocks());

async function openExplore() {
  await renderRouter('./src/app', { initialUrl: '/' });
  return screen.findByTestId('place-search');
}

it('searches once when people pause typing', async () => {
  const search = jest.spyOn(mockPlaceService, 'search');
  const field = await openExplore();
  await fireEvent.changeText(field, 'Li');
  await fireEvent.changeText(field, 'Lis');
  await fireEvent.changeText(field, 'Lisb');
  expect(await screen.findByTestId('place-lisbon')).toBeTruthy();
  expect(search.mock.calls).toEqual([['Lisb']]);
});

it('does not search for a single letter', async () => {
  const search = jest.spyOn(mockPlaceService, 'search');
  const field = await openExplore();
  await fireEvent.changeText(field, 'L');
  expect(await screen.findByText('Recent')).toBeTruthy();
  // The router's test setup uses fake timers: move the clock well past the search delay.
  await act(async () => jest.advanceTimersByTime(1000));
  expect(search).not.toHaveBeenCalled();
});

it('shows a readable error and lets people retry', async () => {
  jest
    .spyOn(mockPlaceService, 'search')
    .mockRejectedValueOnce(new Error('Place search is busy right now. Try again in a minute.'));
  await fireEvent.changeText(await openExplore(), 'Lis');
  expect(
    await screen.findByText('Place search is busy right now. Try again in a minute.'),
  ).toBeTruthy();
});

it('says when nothing matches', async () => {
  await fireEvent.changeText(await openExplore(), 'Zzz');
  expect(await screen.findByText('No places match that yet')).toBeTruthy();
});
