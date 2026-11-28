import { liveWeatherService } from '../live';

const respond = (status: number, body: unknown) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({ ok: status < 400, status, json: async () => body } as Response);

afterEach(() => jest.restoreAllMocks());

// UC-07 View Weather: the live service only talks to the server, never to a weather site.

it('asks the server for the weather now', async () => {
  const fetch = respond(200, { temperature: 64, condition: 'sunny' });
  expect(await liveWeatherService.current('lisbon')).toEqual({
    temperature: 64,
    condition: 'sunny',
  });
  expect(fetch.mock.calls[0][0]).toBe('http://localhost:8000/places/lisbon/weather/current');
});

it('asks for each day of a range, and sends a place id back exactly as it was given', async () => {
  const fetch = respond(200, []);
  await liveWeatherService.daily('google:ChIJ_abc', { start: '2026-12-10', end: '2026-12-14' });
  expect(fetch.mock.calls[0][0]).toBe(
    'http://localhost:8000/places/google%3AChIJ_abc/weather/daily?start=2026-12-10&end=2026-12-14',
  );
});

it("shows the server's message when the weather is unavailable", async () => {
  respond(503, { error: 'The weather service is not responding. Try again soon.' });
  await expect(
    liveWeatherService.daily('lisbon', { start: '2026-12-10', end: '2026-12-11' }),
  ).rejects.toThrow('The weather service is not responding. Try again soon.');
});
