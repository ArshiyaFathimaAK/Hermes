import { useLocalSearchParams } from 'expo-router';

import { SharedTripScreen } from '@/features/shared-trip';

export default function SharedTripRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <SharedTripScreen token={token} />;
}
