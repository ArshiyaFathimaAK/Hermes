export interface Place {
  id: string;
  name: string;
  region: string;
  /** Not used by the screens yet; the server sends them for weather and distances. */
  latitude?: number;
  longitude?: number;
}
