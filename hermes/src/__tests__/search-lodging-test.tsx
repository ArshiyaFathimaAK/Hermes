import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { mockStayService } from '@/services/stays/mock';

// UC-06 Search for Lodging: stays are asked for with the trip's dates, and a live stay that
// lacks some details shows what it has and hides the rest.

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

afterEach(() => jest.restoreAllMocks());

async function openStaysForTheWeekend() {
  await renderRouter('./src/app', { initialUrl: '/place/lisbon?view=stays' });
  await press('dates-chip');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  await press('save-dates');
}

it('asks for stays with the dates picked', async () => {
  const list = jest.spyOn(mockStayService, 'list');
  await openStaysForTheWeekend();
  expect(await screen.findByTestId('stay-river')).toBeTruthy();
  const calls = list.mock.calls.filter(([, dates]) => dates);
  expect(calls).toHaveLength(1);
  const [placeId, dates] = calls[0];
  expect(placeId).toBe('lisbon');
  expect(dates!.start < dates!.end).toBe(true);
});

it('does not ask for stays before there are dates', async () => {
  const list = jest.spyOn(mockStayService, 'list');
  await renderRouter('./src/app', { initialUrl: '/place/lisbon?view=stays' });
  expect(await screen.findByTestId('stays-need-dates')).toBeTruthy();
  expect(list).not.toHaveBeenCalled();
});

it('hides what a stay does not have', async () => {
  jest
    .spyOn(mockStayService, 'list')
    .mockResolvedValue([{ id: 'liteapi:bare', name: 'Bare Hotel', nightly: 100 }]);
  await openStaysForTheWeekend();
  expect(await screen.findByText('Bare Hotel')).toBeTruthy();
  expect(screen.getByText('$200')).toBeTruthy();
  expect(screen.queryByText(/reviews/)).toBeNull();
  expect(screen.queryByText(/undefined/)).toBeNull();
  expect(screen.queryByText(/Free cancellation/)).toBeNull();
});

it('says where stays and prices come from', async () => {
  await openStaysForTheWeekend();
  expect(await screen.findByText(/come from LiteAPI, for two adults/)).toBeTruthy();
});
