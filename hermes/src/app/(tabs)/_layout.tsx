import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, sizes, typography } from '@/theme';
import { Icon, type IconName } from '@/ui/icon';

function tab(title: string, icon: IconName) {
  return {
    title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Icon name={icon} size={24} color={focused ? 'action' : 'textMuted'} />
    ),
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action,
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
