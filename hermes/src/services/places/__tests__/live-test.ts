import { apiGet } from '@/services/api-client';

import { livePlaceService } from '../live';

jest.mock('@/services/api-client', () => ({ apiGet: jest.fn(async () => []) }));

const get = jest.mocked(apiGet);

beforeEach(() => get.mockClear());

it('asks the server, without spaces around the query', async () => {
  await livePlaceService.search('  Lisbo ');
  expect(get).toHaveBeenCalledWith('/places/search', { q: 'Lisbo' });
});

it('never asks the server for under two letters', async () => {
  await expect(livePlaceService.search(' L ')).resolves.toEqual([]);
  expect(get).not.toHaveBeenCalled();
});

it('sends ids back as they are', async () => {
  await livePlaceService.get('google:ChIJ/x');
  expect(get).toHaveBeenCalledWith('/places/google%3AChIJ%2Fx');
});
