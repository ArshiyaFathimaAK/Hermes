import type { Activity, ActivityDetail } from '@/domain/activity';

import type { ActivityService } from './contract';

// Sample data from the design. Prices are made up for the demo.
const ACTIVITIES: Activity[] = [
  {
    id: 'belem', placeId: 'lisbon', category: 'sights', bookable: false,
    name: 'Belém Tower', type: 'Historical landmark', rating: 4.5, reviewCount: '72k',
    image: require('@/assets/images/mock/belem-tower.svg'), photoCredit: 'Sample image',
    summary: 'Early 16th-century fortified tower on the riverbank, with views from the top.',
    where: 'Belém · 25 min by transit', status: 'Open · closes 5:30 PM', openNow: true,
    duration: 'Est. 1 hr', priceLevel: 1, priceLabel: 'Tickets from $9', priceAmount: 9,
    amenities: ['Good for kids'],
  },
  {
    id: 'alfama', placeId: 'lisbon', category: 'tours', bookable: true,
    name: 'Alfama Walking Tour with Tram 28 Ride', type: 'Walking tour', rating: 4.8, reviewCount: '2.1k',
    image: require('@/assets/images/mock/alfama-tour.svg'), photoCredit: 'Sample image',
    summary: 'Guided walk through Lisbon’s oldest neighborhood, ending with a ride on the historic tram.',
    where: 'Meets at Martim Moniz · 12 min by transit', status: 'Daily · starts 10:00 AM', openNow: false,
    duration: '3 hrs', priceLevel: 2, priceLabel: 'From $28 per person', priceAmount: 28,
    amenities: ['Outdoors'],
  },
  {
    id: 'lxf', placeId: 'lisbon', category: 'sights', bookable: false,
    name: 'LX Factory', type: 'Tourist attraction', rating: 4.6, reviewCount: '48k',
    image: require('@/assets/images/mock/lx-factory.svg'), photoCredit: 'Sample image',
    summary: 'Converted industrial complex with independent shops, restaurants and a big bookstore.',
    where: 'Alcântara · 20 min by transit', status: 'Open · hours vary by shop', openNow: true,
    duration: 'Est. 2 hrs', amenities: ['Good for kids', 'Wheelchair accessible'],
  },
  {
    id: 'sintra', placeId: 'lisbon', category: 'tours', bookable: true,
    name: 'Sintra & Pena Palace Day Trip from Lisbon', type: 'Day trip', rating: 4.7, reviewCount: '5.4k',
    image: require('@/assets/images/mock/sintra-day-trip.svg'), photoCredit: 'Sample image',
    summary: 'Full-day tour with transport to Pena Palace, Sintra’s old town and the coast at Cabo da Roca.',
    where: 'Pickup in central Lisbon', status: 'Daily · 9:00 AM pickup', openNow: false,
    duration: '8 hrs', priceLevel: 3, priceLabel: 'From $75 per person', priceAmount: 75,
    amenities: ['Outdoors'],
  },
  {
    id: 'market', placeId: 'lisbon', category: 'food', bookable: false,
    name: 'Time Out Market Lisboa', type: 'Food court', rating: 4.4, reviewCount: '60k',
    image: require('@/assets/images/mock/time-out-market.svg'), photoCredit: 'Sample image',
    summary: 'Busy food hall bringing together stalls from local chefs and restaurants.',
    where: 'Cais do Sodré · 10 min by transit', status: 'Open · closes 12 AM', openNow: true,
    duration: 'Est. 1–2 hrs', priceLevel: 2, priceLabel: '$$ · moderate', priceAmount: 20,
    amenities: ['Good for kids', 'Wheelchair accessible'],
  },
  {
    id: 'miradouro', placeId: 'lisbon', category: 'sights', bookable: false,
    name: 'Miradouro da Senhora do Monte', type: 'Scenic viewpoint', rating: 4.7, reviewCount: '25k',
    image: require('@/assets/images/mock/miradouro.svg'), photoCredit: 'Sample image',
    where: 'Graça · 18 min by transit', status: 'Open 24 hours', openNow: true,
    duration: 'Est. 30 min', amenities: ['Outdoors'],
  },
  {
    id: 'fushimi-inari', placeId: 'kyoto', category: 'sights', bookable: false,
    name: 'Fushimi Inari Taisha', type: 'Shinto shrine', rating: 4.6, reviewCount: '80k',
    image: require('@/assets/images/mock/fushimi-inari.svg'), photoCredit: 'Sample image',
    summary: 'Mountainside shrine known for its long trails of vermilion gates.',
    where: 'Fushimi · 15 min by transit', status: 'Open 24 hours', openNow: true,
    duration: 'Est. 2 hrs', priceLevel: 0, priceLabel: 'Free', priceAmount: 0,
    amenities: ['Outdoors'],
  },
  {
    // No price and no summary, to check that missing fields stay hidden.
    id: 'arashiyama', placeId: 'kyoto', category: 'sights', bookable: false,
    name: 'Arashiyama Bamboo Grove', type: 'Scenic walk', rating: 4.3, reviewCount: '20k',
    image: require('@/assets/images/mock/arashiyama.svg'), photoCredit: 'Sample image',
    where: 'Arashiyama · 30 min by transit', status: 'Open 24 hours', openNow: true,
    duration: 'Est. 1 hr', amenities: ['Outdoors', 'Good for kids'],
  },
  {
    id: 'nishiki', placeId: 'kyoto', category: 'food', bookable: false,
    name: 'Nishiki Market', type: 'Food market', rating: 4.3, reviewCount: '45k',
    image: require('@/assets/images/mock/nishiki-market.svg'), photoCredit: 'Sample image',
    summary: 'Narrow covered street lined with food stalls and specialty shops.',
    where: 'Nakagyo · 8 min walk', status: 'Open · closes 6 PM', openNow: true,
    duration: 'Est. 1–2 hrs', priceLevel: 2, priceLabel: '$$ · moderate', priceAmount: 18,
    amenities: ['Wheelchair accessible'],
  },
  {
    id: 'tea', placeId: 'kyoto', category: 'tours', bookable: true,
    name: 'Tea Ceremony in Gion', type: 'Cultural experience', rating: 4.9, reviewCount: '1.3k',
    image: require('@/assets/images/mock/tea-ceremony.svg'), photoCredit: 'Sample image',
    summary: 'Small-group tea ceremony with a host who explains each step.',
    where: 'Gion · 12 min by transit', status: 'Daily · starts 11:00 AM', openNow: false,
    duration: '1 hr', priceLevel: 2, priceLabel: 'From $32 per person', priceAmount: 32,
    amenities: [],
  },
];

const DETAILS: Record<string, Partial<ActivityDetail>> = {
  'fushimi-inari': {
    photoCount: 8,
    travel: '15 min by transit from the city center',
    nearby: [{ id: 'nishiki', name: 'Nishiki Market', meta: '★ 4.3 · Food market · $$' }],
  },
  belem: {
    photoCount: 10,
    hours: '10 AM – 5:30 PM',
    about:
      'Built in the early 1500s to defend the mouth of the Tagus, the tower is one of Lisbon’s best-known monuments. It’s listed as a World Heritage Site together with the nearby Jerónimos Monastery.',
    aboutCredit: 'From Wikipedia · CC BY-SA',
    address: 'Av. Brasília, 1400-038 Lisboa',
    travel: '25 min by transit from the city center · Tram 15E',
    nearby: [
      { id: 'lxf', name: 'LX Factory', meta: '★ 4.6 · Tourist attraction' },
      { id: 'market', name: 'Time Out Market Lisboa', meta: '★ 4.4 · Food court · $$' },
    ],
  },
};

export const mockActivityService: ActivityService = {
  async list(placeId) {
    return ACTIVITIES.filter((a) => a.placeId === placeId);
  },
  async getMany(activityIds) {
    return ACTIVITIES.filter((a) => activityIds.includes(a.id));
  },
  async detail(activityId) {
    const activity = ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) throw new Error('We could not find that.');
    const query = encodeURIComponent(`${activity.name} ${activity.placeId}`);
    return {
      ...activity,
      nearby: [],
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
      ...DETAILS[activityId],
    };
  },
};
