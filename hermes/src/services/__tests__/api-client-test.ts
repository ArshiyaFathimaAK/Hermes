import { livePlaceService } from '@/services/places/live';

import { apiGet, apiPost } from '../api-client';

const respond = (status: number, body: unknown) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({ ok: status < 400, status, json: async () => body } as Response);

afterEach(() => jest.restoreAllMocks());

it('builds the URL from the server address, the path and the query', async () => {
  const fetch = respond(200, [{ id: 'lisbon' }]);
  await apiGet('/places/search', { q: 'lis bon', skip: undefined });
  expect(fetch.mock.calls[0][0]).toBe('http://localhost:8000/places/search?q=lis%20bon');
});

it('sends JSON bodies', async () => {
  const fetch = respond(200, {});
  await apiPost('/costs/estimate', { nights: 2 });
  expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"nights":2}' });
});

it("shows the server's error message", async () => {
  respond(404, { error: 'We could not find that place.' });
  await expect(apiGet('/places/x')).rejects.toThrow('We could not find that place.');
});

it('explains when the server is unreachable', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
  await expect(apiGet('/health')).rejects.toThrow("Can't reach the server");
});

it('lets the live place service skip the server for an empty search', async () => {
  const fetch = respond(200, []);
  expect(await livePlaceService.search('  ')).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});
