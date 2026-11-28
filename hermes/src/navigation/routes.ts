import { router, type Href } from 'expo-router';

export type PlaceView = 'things-to-do' | 'stays';

/** Every destination in the app. Screens use these instead of typing paths. */
export const routes = {
  explore: '/' as Href,
  trips: '/trips' as Href,
  account: '/account' as Href,
  place: (placeId: string, view: PlaceView = 'things-to-do'): Href => ({
    pathname: '/place/[placeId]',
    params: { placeId, view },
  }),
  activity: (activityId: string): Href => ({
    pathname: '/activity/[activityId]',
    params: { activityId },
  }),
  /** A stay's own screen. `placeId` is the place it's for: it sets dates, weather and the trip. */
  stay: (stayId: string, placeId: string): Href => ({
    pathname: '/stay/[stayId]',
    params: { stayId, placeId },
  }),
  dates: (placeId: string): Href => ({ pathname: '/dates/[placeId]', params: { placeId } }),
  sharedTrip: (token: string): Href => ({ pathname: '/shared/[token]', params: { token } }),
  newTrip: '/pick-place' as Href,
  addPlace: (tripId: string): Href => ({ pathname: '/pick-place', params: { tripId } }),
  signIn: '/sign-in' as Href,
  signUp: '/sign-up' as Href,
  editProfile: '/edit-profile' as Href,
};

/** Goes back, or to Explore when the screen was opened directly from a link. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace(routes.explore);
}
