export interface Stay {
  id: string;
  placeId: string;
  name: string;
  kind: string;
  area: string;
  score: number;
  scoreWord: string;
  reviewCount: string;
  /** Distance to the user's saved activities. */
  near: string;
  nightly: number;
  freeCancellation: boolean;
  amenities: string[];
  /** Position on the map, as a fraction (0-1) of its width and height. */
  mapPosition: { x: number; y: number };
}
