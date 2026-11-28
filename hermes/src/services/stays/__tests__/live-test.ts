import { apiGet } from '@/services/api-client';

import { liveStayService } from '../live';

jest.mock('@/services/api-client', () => ({ apiGet: jest.fn(async () => []) }));

const get = jest.mocked(apiGet);
const weekend = { start: '2027-01-12', end: '2027-01-14' };

beforeEach(() => get.mockClear());

it('asks for stays near a place on the dates', async () => {
  await liveStayService.list('google:ChIJ/x', weekend);
  expect(get).toHaveBeenCalledWith('/places/google%3AChIJ%2Fx/stays', {
    checkIn: '2027-01-12',
    checkOut: '2027-01-14',
  });
});

it('asks without dates when there are none', async () => {
  await liveStayService.list('kyoto');
  expect(get).toHaveBeenCalledWith('/places/kyoto/stays', {});
});

it('asks for saved stays by id, with dates for their prices', async () => {
  await liveStayService.getMany(['liteapi:a', 'river'], weekend);
  expect(get).toHaveBeenCalledWith('/stays', {
    ids: 'liteapi:a,river',
    checkIn: '2027-01-12',
    checkOut: '2027-01-14',
  });
});

it('never asks for no stays', async () => {
  await expect(liveStayService.getMany([])).resolves.toEqual([]);
  expect(get).not.toHaveBeenCalled();
});

it('asks for one stay by id, with dates for its price', async () => {
  await liveStayService.detail('liteapi:lp6557b9a5', weekend);
  expect(get).toHaveBeenCalledWith('/stays/liteapi%3Alp6557b9a5', {
    checkIn: '2027-01-12',
    checkOut: '2027-01-14',
  });
});
