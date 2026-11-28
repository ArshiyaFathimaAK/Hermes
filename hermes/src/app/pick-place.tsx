import { useLocalSearchParams } from 'expo-router';

import { PickPlaceScreen } from '@/features/trips';

export default function PickPlaceRoute() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  return <PickPlaceScreen tripId={tripId} />;
}
