import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ActivityDetail } from '@/domain/activity';
import type { DateRange } from '@/domain/dates';
import { CONDITION_LABELS, useCurrentWeather, useDailyWeather } from '@/features/weather';
import { goBack, routes } from '@/navigation/routes';
import { useTemperature } from '@/state/preferences';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { ListGroup, ListRow } from '@/ui/list-group';
import { MapView } from '@/ui/map-view';
import { Photo } from '@/ui/photo';
import { FooterBar, Screen } from '@/ui/screen';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';

import { FactTile } from './fact-tile';
import { useActivity } from './use-activity';

export function ActivityScreen({ activityId }: { activityId: string }) {
  const { state, tripName, saved, dates, toggleSaved } = useActivity(activityId);
  const insets = useSafeAreaInsets();
  const ready = state.status === 'ready';

  return (
    <Screen
      testID="activity-screen"
      edgeToEdge={ready}
      padded={false}
      footer={
        ready && (
          <FooterBar>
            <Button
              variant="outline"
              icon="directions"
              label="Directions"
              onPress={() => Linking.openURL(state.data.activity.directionsUrl)}
            />
            <Button
              testID="save-activity"
              variant={saved ? 'soft' : 'primary'}
              icon={saved ? 'check' : 'add'}
              label={saved ? `Saved to ${tripName} trip` : 'Save to trip'}
              selected={saved}
              onPress={toggleSaved}
              style={styles.fill}
            />
          </FooterBar>
        )
      }>
      {!ready && <IconButton icon="back" label="Back" onPress={goBack} />}
      <AsyncView state={state}>
        {({ activity }) => (
          <>
            <Photo source={activity.image} alt={activity.name} style={styles.photo}>
              <IconButton
                icon="back"
                variant="raised"
                label="Back"
                onPress={goBack}
                style={[styles.back, { top: insets.top + spacing.sm }]}
              />
              {activity.photoCredit && (
                <Badge variant="overlay" label={activity.photoCredit} style={styles.credit} />
              )}
              {activity.photoCount !== undefined && (
                <Badge variant="overlay" label={`1 / ${activity.photoCount}`} style={styles.count} />
              )}
            </Photo>
            <View style={styles.body}>
              <Intro activity={activity} />
              <Facts activity={activity} dates={dates} />
              <Details activity={activity} />
            </View>
          </>
        )}
      </AsyncView>
    </Screen>
  );
}

function Intro({ activity }: { activity: ActivityDetail }) {
  return (
    <View style={styles.intro}>
      <Badge label={activity.type} />
      <Text variant="title" accessibilityRole="header">
        {activity.name}
      </Text>
      {activity.rating !== undefined && (
        <View style={styles.row}>
          <Icon name="star" size={16} />
          <Text weight="bold">{activity.rating}</Text>
          {activity.reviewCount && (
            <Text color="textSecondary">· {activity.reviewCount} Google reviews</Text>
          )}
        </View>
      )}
      {activity.summary && <Text variant="label" weight="medium">{activity.summary}</Text>}
    </View>
  );
}

function Facts({ activity, dates }: { activity: ActivityDetail; dates?: DateRange }) {
  const formatTemp = useTemperature();
  const current = useCurrentWeather(activity.placeId);
  const daily = useDailyWeather(activity.placeId, dates);

  const firstDay = daily.status === 'ready' ? daily.data[0] : undefined;
  const now = current.status === 'ready' ? current.data : undefined;
  const weather = firstDay
    ? { label: 'Weather on day 1', temperature: firstDay.high, condition: firstDay.condition }
    : now && { label: 'Weather now', ...now };

  return (
    <View style={styles.facts}>
      <FactTile label="Hours" value={activity.hours ?? activity.status} />
      {weather && (
        <FactTile
          label={weather.label}
          value={`${formatTemp(weather.temperature)} ${CONDITION_LABELS[weather.condition]}`}
          note={firstDay?.isTypical ? 'Typical weather' : undefined}
          icon={<Icon name={weather.condition} size={18} />}
        />
      )}
      {activity.duration && <FactTile label="Time to spend" value={activity.duration} />}
      {activity.priceLabel && <FactTile label="Price" value={activity.priceLabel} />}
    </View>
  );
}

function Details({ activity }: { activity: ActivityDetail }) {
  const { websiteUrl } = activity;
  return (
    <>
      {activity.about && (
        <Section title="About" tone="strong">
          <Text color="textSecondary">{activity.about}</Text>
          {activity.aboutCredit && (
            <Text variant="caption" color="textMuted">
              {activity.aboutCredit}
            </Text>
          )}
        </Section>
      )}
      <Section title="Where it is" tone="strong">
        <MapView
          height={150}
          pins={[{ id: activity.id, label: `${activity.name} on the map`, position: { x: 0.5, y: 0.4 } }]}
        />
        {activity.address && <Text weight="semibold">{activity.address}</Text>}
        <Text color="textMuted">{activity.travel ?? activity.where}</Text>
      </Section>
      {activity.nearby.length > 0 && (
        <Section title="Close by" tone="strong">
          <ListGroup>
            {activity.nearby.map((nearby) => (
              <ListRow
                key={nearby.id}
                title={nearby.name}
                subtitle={nearby.meta}
                onPress={() => router.push(routes.activity(nearby.id))}
              />
            ))}
          </ListGroup>
        </Section>
      )}
      <View style={styles.links}>
        {websiteUrl && (
          <Button
            variant="plain"
            icon="external"
            label="Official website"
            onPress={() => WebBrowser.openBrowserAsync(websiteUrl)}
          />
        )}
        <Button
          variant="plain"
          icon="external"
          label="Open in Google Maps"
          onPress={() => Linking.openURL(activity.mapsUrl)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  photo: { height: 300 },
  back: { position: 'absolute', left: spacing.lg },
  credit: { position: 'absolute', left: spacing.lg, bottom: spacing.lg },
  count: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
  body: { gap: spacing.xxl, padding: spacing.xl },
  intro: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
});
