import { useLocalSearchParams } from 'expo-router';

import { StayScreen } from '@/features/stays';

export default function StayRoute() {
  const { stayId, placeId } = useLocalSearchParams<{ stayId: string; placeId: string }>();
  return <StayScreen stayId={stayId} placeId={placeId} />;
}
