import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, typography, useColors } from '@/theme';
import { Icon, type IconName } from '@/ui/icon';

// The tab behind screens that were opened from a link.
export const unstable_settings = { anchor: '(explore)' };

function tab(title: string, icon: IconName) {
  return {
    title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Icon name={icon} size={24} color={focused ? 'actionText' : 'textMuted'} />
    ),
  };
}

export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      // Back from another tab goes to Explore, the anchor above.
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.actionText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: typography.tabLabel,
        tabBarStyle: {
          height: sizes.tabBar + insets.bottom,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen name="(explore)" options={tab('Explore', 'search')} />
      <Tabs.Screen name="(trips)" options={tab('Trips', 'trips')} />
      <Tabs.Screen name="account" options={tab('Account', 'person')} />
    </Tabs>
  );
}
