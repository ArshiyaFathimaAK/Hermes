import { useLocalSearchParams } from 'expo-router';

import { DatesScreen } from '@/features/dates';

export default function DatesRoute() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  return <DatesScreen placeId={placeId} />;
}
