import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { routes } from '@/navigation/routes';
import { useShowTrips } from '@/navigation/use-show-trips';
import { usePreferences } from '@/state/preferences';
import { useSession } from '@/state/session';
import { useTrips } from '@/state/trips';
import { colors, radius, spacing } from '@/theme';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { ListGroup, ListRow } from '@/ui/list-group';
import { Screen } from '@/ui/screen';
import { Section } from '@/ui/section';
import { SegmentedControl } from '@/ui/segmented-control';
import { Text } from '@/ui/text';
import type { TemperatureUnit } from '@/utils/format';

const UNITS: { value: TemperatureUnit; label: string }[] = [
  { value: 'F', label: '°F' },
  { value: 'C', label: '°C' },
];

export function AccountScreen() {
  const { user, signOut } = useSession();
  const { trips } = useTrips();
  const showTrips = useShowTrips();
  const { temperatureUnit, setTemperatureUnit } = usePreferences();

  return (
    <Screen testID="account-screen">
      <Text variant="title" accessibilityRole="header">
        Account
      </Text>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Icon name="person" size={30} color="textOnInverse" />
        </View>
        <View style={styles.fill}>
          <Text variant="subheading">{user?.name ?? 'Guest'}</Text>
          <Text color="textMuted">{user?.email ?? "You're not signed in"}</Text>
        </View>
        {user && (
          <Button
            testID="edit-profile"
            variant="plain"
            label="Edit"
            onPress={() => router.push(routes.editProfile)}
          />
        )}
      </View>
      {!user && (
        <Button
          testID="open-sign-in"
          label="Sign in or create an account"
          onPress={() => router.push(routes.signIn)}
        />
      )}
      {user && (
        <ListGroup>
          <ListRow
            title="Your trips"
            value={String(trips.length)}
            onPress={() => showTrips()}
          />
          <ListRow title="Saved stays" value="Coming soon" disabled />
        </ListGroup>
      )}
      <Section title="Settings">
        <ListGroup>
          <ListRow
            title="Temperature"
            trailing={
              <SegmentedControl
                label="Temperature"
                options={UNITS}
                value={temperatureUnit}
                onChange={setTemperatureUnit}
              />
            }
          />
          <ListRow title="Connected calendar" value="Coming soon" disabled />
          <ListRow title="Help & feedback" value="Coming soon" disabled />
        </ListGroup>
      </Section>
      {user && <Button testID="sign-out" variant="quiet" label="Sign out" onPress={signOut} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.inverse,
  },
  fill: { flex: 1 },
});
