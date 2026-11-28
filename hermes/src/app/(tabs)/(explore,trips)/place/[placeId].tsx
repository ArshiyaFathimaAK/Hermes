import { useLocalSearchParams } from 'expo-router';

import { DestinationScreen } from '@/features/destination';

export default function PlaceRoute() {
  const { placeId, view } = useLocalSearchParams<{ placeId: string; view?: string }>();
  return <DestinationScreen placeId={placeId} view={view === 'stays' ? 'stays' : 'things-to-do'} />;
}
