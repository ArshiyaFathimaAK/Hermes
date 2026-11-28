/**
 * A place to stay. Live stays come from LiteAPI through the server, which doesn't know
 * everything: any optional field may be missing, and screens hide what's missing.
 */
export interface Stay {
  id: string;
  name: string;
  /** A small photo for lists. */
  photo?: string;
  /** The place it was listed for. Missing when looked up by id alone. */
  placeId?: string;
  kind?: string;
  /** Neighborhood. */
  area?: string;
  /** Guest score out of 10. */
  score?: number;
  scoreWord?: string;
  reviewCount?: string;
  /** Distance to the user's saved activities. */
  near?: string;
  /** Price for one night on the dates asked for. Missing without dates, or with no room then. */
  nightly?: number;
  freeCancellation?: boolean;
  amenities?: string[];
  /** Position on the map, as a fraction (0-1) of its width and height. */
  mapPosition?: { x: number; y: number };
  latitude?: number;
  longitude?: number;
}

/** A landmark near a stay. */
export interface NearbyPlace {
  name: string;
  /** e.g. "3.2 km". */
  distance?: string;
}

/** Everything known about one stay, for its own screen. Lists are empty when unknown. */
export interface StayDetail extends Stay {
  /** A large photo for the top of the screen. */
  mainPhoto?: string;
  starRating?: number;
  /** Paragraphs of plain text. */
  about?: string[];
  aboutCredit?: string;
  /** As the hotel writes them, e.g. "3:00 PM". */
  checkInFrom?: string;
  checkOutUntil?: string;
  /** What guests liked and disliked, summarized from reviews by the source. */
  liked?: string[];
  disliked?: string[];
  facilities?: string[];
  goodToKnow?: string[];
  address?: string;
  phone?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  /** A search for this stay and the dates on a booking site. Not a booking or a price. */
  bookingUrl?: string;
  bookingSite?: string;
  nearby?: NearbyPlace[];
}
