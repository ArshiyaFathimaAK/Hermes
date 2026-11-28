import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { weatherService } from '@/services/weather';

// UC-07 View Weather, on the mock services. Rules of the live service are tested in
// services/weather/__tests__ and in server/tests/test_weather_live.py.

const open = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

afterEach(() => jest.restoreAllMocks());

it('shows the forecast for the days a guest picks, without an account', async () => {
  await open('/dates/lisbon');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  expect(await screen.findByText('Forecast. It updates every day until you go.')).toBeTruthy();
  expect(screen.queryByText('Typical')).toBeNull();
  expect(screen.getByText('Weather data by Open-Meteo')).toBeTruthy();
});

it('labels days that are only typical weather, not a forecast', async () => {
  jest.spyOn(weatherService, 'daily').mockImplementation(async (_placeId, { start }) => [
    { date: start, high: 61, low: 51, condition: 'cloudy', isTypical: true },
  ]);
  await open('/dates/lisbon');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  expect(await screen.findByText('Typical')).toBeTruthy();
  expect(screen.getByText(/typical weather from past years, not a forecast/)).toBeTruthy();
});

it('explains when the weather is unavailable and lets the person try again', async () => {
  const daily = jest
    .spyOn(weatherService, 'daily')
    .mockRejectedValueOnce(new Error('The weather service is not responding. Try again soon.'));
  await open('/dates/lisbon');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  expect(await screen.findByText('The weather service is not responding. Try again soon.')).toBeTruthy();
  expect(screen.queryByText('Typical')).toBeNull();
  await fireEvent.press(await screen.findByText('Try again'));
  expect(await screen.findByText('Forecast. It updates every day until you go.')).toBeTruthy();
  expect(daily).toHaveBeenCalled();
});
