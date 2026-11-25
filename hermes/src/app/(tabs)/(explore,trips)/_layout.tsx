import { Stack } from 'expo-router';

// Both tabs get their own copy of the routes in this folder, so opening a place
// stays in the current tab and back returns to where you were.
export const unstable_settings = {
  anchor: 'index',
  explore: { anchor: 'index' },
  trips: { anchor: 'trips' },
};

export default function TabStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
