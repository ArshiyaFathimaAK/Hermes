/**
 * A place to stay. Live stays come from LiteAPI through the server, which doesn't know
 * everything: any optional field may be missing, and screens hide what's missing.
 */
export interface Stay {
  id: string;
  name: string;
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
