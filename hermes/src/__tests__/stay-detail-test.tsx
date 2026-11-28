import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import type { StayDetail } from '@/domain/stay';
import { mockStayService } from '@/services/stays/mock';

// UC-06 a stay's own screen, like a thing to do's: opened from the stays list and from the trip,
// priced for the trip's dates, chosen for the trip from there, and hiding what isn't known.

const press = async (testID: string) => fireEvent.press(await screen.findByTestId(testID));

afterEach(() => jest.restoreAllMocks());

async function openStaysForTheWeekend() {
  await renderRouter('./src/app', { initialUrl: '/place/lisbon?view=stays' });
  await press('dates-chip');
  await fireEvent.press(await screen.findByLabelText('This weekend'));
  await press('save-dates');
}

it('opens from the stays list, priced for the dates', async () => {
  await openStaysForTheWeekend();
  await press('open-stay-river');
  expect(await screen.findByTestId('stay-screen')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Riverside apartment, Cais do Sodré' })).toBeTruthy();
  expect(screen.getByText('$276 for 2 nights')).toBeTruthy();
  expect(screen.getByText('$138 a night')).toBeTruthy();
  expect(screen).toHavePathname('/stay/river');
});

it('hides what a sample stay does not have', async () => {
  await openStaysForTheWeekend();
  await press('open-stay-river');
  await screen.findByTestId('stay-screen');
  expect(screen.queryByText('About')).toBeNull();
  expect(screen.queryByText('What guests say')).toBeNull();
  expect(screen.queryByText('Close by')).toBeNull();
  expect(screen.queryByText('Call')).toBeNull();
  expect(screen.queryByText(/undefined/)).toBeNull();
});

it('is chosen for the trip, and opens from the trip page', async () => {
  await renderRouter('./src/app', { initialUrl: '/sign-in' });
  await press('demo-sign-in');
  // The sample Lisbon trip has dates and no stay yet.
  await fireEvent.press(await screen.findByLabelText(/^Trips/));
  await fireEvent.press(await screen.findByText('Find a stay'));
  await press('open-stay-river');
  await press('choose-stay');
  expect(await screen.findByText('Chosen for Lisbon trip')).toBeTruthy();

  // Back on the trip, its stay banner opens the same screen.
  await fireEvent.press(screen.getByLabelText('Back'));
  await fireEvent.press(await screen.findByLabelText('Back'));
  expect(await screen.findByTestId('trips-screen')).toBeTruthy();
  await press('open-stay-river');
  expect(await screen.findByTestId('stay-screen')).toBeTruthy();
  expect(await screen.findByText('Chosen for Lisbon trip')).toBeTruthy();
});

it('shows everything a live stay has, with a booking site search', async () => {
  const full: StayDetail = {
    id: 'liteapi:blossom',
    name: 'THE BLOSSOM KYOTO',
    kind: 'Hotel',
    starRating: 4,
    score: 9.3,
    scoreWord: 'Wonderful',
    reviewCount: '5,005',
    nightly: 120,
    freeCancellation: true,
    mainPhoto: 'https://example.com/a.jpg',
    about: ['Luxurious Accommodation in the Heart of Kyoto', 'Close to Gion.'],
    aboutCredit: 'Description from LiteAPI',
    checkInFrom: '3:00 PM',
    checkOutUntil: '11:00 AM',
    liked: ['Cleanliness', 'Great Location'],
    disliked: ['Limited Food Quality'],
    facilities: Array.from({ length: 14 }, (_, n) => `Facility ${n + 1}`),
    goodToKnow: ['A deposit may be required at the property.'],
    address: '140-2 Manjujicho, Shimogyo-ku, Kyoto 600-8104',
    phone: '+81 75-754-8735',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=THE%20BLOSSOM%20KYOTO',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=THE+BLOSSOM+KYOTO',
    bookingSite: 'Booking.com',
    nearby: [{ name: 'Fushimi Inari Taisha', distance: '3.2 km' }],
  };
  jest.spyOn(mockStayService, 'detail').mockResolvedValue(full);
  await openStaysForTheWeekend();
  await press('open-stay-river');

  expect(await screen.findByText('$240 for 2 nights')).toBeTruthy();
  expect(screen.getByText('4-star hotel')).toBeTruthy();
  // One photo, not a gallery: nothing suggests swiping.
  expect(screen.queryByText(/^1 \//)).toBeNull();
  expect(screen.getByText('From 3:00 PM')).toBeTruthy();
  expect(screen.getByText('Until 11:00 AM')).toBeTruthy();
  expect(screen.getByText('Free cancellation')).toBeTruthy();
  expect(screen.getByText('Close to Gion.')).toBeTruthy();
  expect(screen.getByText(/Cleanliness, Great Location/)).toBeTruthy();
  expect(screen.getByText('A deposit may be required at the property.')).toBeTruthy();
  expect(screen.getByText('Fushimi Inari Taisha')).toBeTruthy();
  expect(screen.getByText('3.2 km')).toBeTruthy();
  expect(screen.getByLabelText('Check availability on Booking.com')).toBeTruthy();
  expect(screen.getByLabelText('Call THE BLOSSOM KYOTO')).toBeTruthy();

  // The first 12 amenities, then all of them.
  expect(screen.queryByText(/Facility 13/)).toBeNull();
  await fireEvent.press(screen.getByText('Show all 14'));
  expect(screen.getByText(/Facility 14/)).toBeTruthy();
});

it('asks for the stay with the dates picked', async () => {
  const detail = jest.spyOn(mockStayService, 'detail');
  await openStaysForTheWeekend();
  await press('open-stay-river');
  await screen.findByTestId('stay-screen');
  const [stayId, dates] = detail.mock.calls[0];
  expect(stayId).toBe('river');
  expect(dates!.start < dates!.end).toBe(true);
});

it('says when there are no dates instead of showing a price', async () => {
  await renderRouter('./src/app', {
    initialUrl: '/stay/chiado?placeId=lisbon',
  });
  expect(await screen.findByTestId('stay-screen')).toBeTruthy();
  expect(await screen.findByText('Add dates to see')).toBeTruthy();
});
