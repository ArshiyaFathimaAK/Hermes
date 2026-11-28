// Plain JavaScript: it uses Node's file system, which the app's TypeScript setup leaves out on purpose.
const { readdirSync } = require('node:fs');
const { join } = require('node:path');

const { resetMockTrips } = require('@/services/trips/mock');

// Tests always use the mock services, even after a service is switched to live in its index.ts.
// Otherwise switching one service would make every screen test call Supabase or the server.
// To test a live service, import its live.ts directly and replace the network part.
// (Folders are listed first: Jest moves jest.mock calls above any `if` in the same block.)
const mockServiceNames = readdirSync(join(__dirname, 'src/services'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('__'))
  .map((entry) => entry.name);
for (const mockServiceName of mockServiceNames) {
  jest.mock(`@/services/${mockServiceName}`, () => {
    const mockModule = jest.requireActual(`@/services/${mockServiceName}/mock`);
    const mockKey = Object.keys(mockModule).find((key) => /^mock\w+Service$/.test(key));
    if (!mockKey) {
      throw new Error(`services/${mockServiceName}/mock.ts must export mock<Name>Service`);
    }
    // mockTripService is exported from the index as tripService.
    const exported = mockKey[4].toLowerCase() + mockKey.slice(5);
    return { [exported]: mockModule[mockKey] };
  });
}

// Mock data lives in memory, so start every test from the same place.
beforeEach(resetMockTrips);

// Navigators log instead of throwing when they can't do what was asked. Make that fail the test.
let consoleError;

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
