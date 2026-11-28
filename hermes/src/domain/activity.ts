import type { ImageSource } from 'expo-image';

export type ActivityCategory = 'sights' | 'food' | 'tours';

/** Optional fields are hidden in the UI when missing. Never fill one in. */
export interface Activity {
  id: string;
  placeId: string;
  category: ActivityCategory;
  /** True for tours that can be booked. */
  bookable: boolean;
  name: string;
  type: string;
  rating?: number;
  reviewCount?: string;
  image?: ImageSource | number;
  photoCredit?: string;
  summary?: string;
  where: string;
  status: string;
  openNow: boolean;
  duration?: string;
  /** 0 = free, 1-4 = $ to $$$$. Missing when no source has it. */
  priceLevel?: 0 | 1 | 2 | 3 | 4;
  priceLabel?: string;
  /** Estimated price per person in USD, used by the trip cost estimate. */
  priceAmount?: number;
  amenities: string[];
}

export interface NearbyActivity {
  id: string;
  name: string;
  meta: string;
}

export interface ActivityDetail extends Activity {
  photoCount?: number;
  hours?: string;
  about?: string;
  aboutCredit?: string;
  address?: string;
  travel?: string;
  nearby: NearbyActivity[];
  websiteUrl?: string;
  mapsUrl: string;
  directionsUrl: string;
}
