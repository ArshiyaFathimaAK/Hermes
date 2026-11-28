import { useLocalSearchParams } from 'expo-router';

import { ActivityScreen } from '@/features/activity';

export default function ActivityRoute() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  return <ActivityScreen activityId={activityId} />;
}
