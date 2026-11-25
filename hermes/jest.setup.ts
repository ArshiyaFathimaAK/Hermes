import { resetMockTrips } from '@/services/trips/mock';

// Mock data lives in memory, so start every test from the same place.
beforeEach(resetMockTrips);

// Navigators log instead of throwing when they can't do what was asked. Make that fail the test.
let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error');
});

afterEach(() => {
  const unhandled = consoleError.mock.calls
    .flat()
    .filter((message) => String(message).includes('was not handled by any navigator'));
  consoleError.mockRestore();
  expect(unhandled).toEqual([]);
});
