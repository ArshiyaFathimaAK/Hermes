import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DateRange } from '@/domain/dates';
import type { StayDetail } from '@/domain/stay';
import { CONDITION_LABELS, useCurrentWeather, useDailyWeather } from '@/features/weather';
import { goBack } from '@/navigation/routes';
import { useTemperature } from '@/state/preferences';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { FactTile } from '@/ui/fact-tile';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { ListGroup, ListRow } from '@/ui/list-group';
import { MapView } from '@/ui/map-view';
import { Photo } from '@/ui/photo';
import { FooterBar, Screen } from '@/ui/screen';
import { Section } from '@/ui/section';
import { Text } from '@/ui/text';
import { formatMoney, pluralize } from '@/utils/format';

import { photoSource } from './photo-source';
import { useStay } from './use-stay';

/** Amenities shown before "Show all". */
const FIRST_FACILITIES = 12;

/** UC-06 one stay, laid out like a thing to do (features/activity) so the two feel the same. */
export function StayScreen({ stayId, placeId }: { stayId: string; placeId: string }) {
  const { state, dates, nights, chosen, tripName, toggleChosen } = useStay(stayId, placeId);
  const insets = useSafeAreaInsets();
  const ready = state.status === 'ready';
  const bookingUrl = ready ? state.data.stay.bookingUrl : undefined;

  return (
    <Screen
      testID="stay-screen"
      edgeToEdge={ready}
      padded={false}
      footer={
        ready && (
          <FooterBar>
            {bookingUrl && (
              <Button
                testID="check-availability"
                variant="outline"
                icon="external"
                label="Check availability"
                accessibilityLabel={`Check availability on ${state.data.stay.bookingSite ?? 'a booking site'}`}
                onPress={() => WebBrowser.openBrowserAsync(bookingUrl)}
              />
            )}
            <Button
              testID="choose-stay"
              variant={chosen ? 'soft' : 'primary'}
              icon={chosen ? 'check' : 'add'}
              label={chosen ? `Chosen for ${tripName} trip` : 'Use for this trip'}
              selected={chosen}
              onPress={toggleChosen}
              style={styles.fill}
            />
          </FooterBar>
        )
      }>
      {!ready && <IconButton icon="back" label="Back" onPress={goBack} />}
      <AsyncView state={state}>
        {({ stay }) => (
          <>
            <Photo
              source={photoSource(stay.mainPhoto ?? stay.photo)}
              alt={stay.name}
              style={styles.photo}>
              <IconButton
                icon="back"
                variant="raised"
                label="Back"
                onPress={goBack}
                style={[styles.back, { top: insets.top + spacing.sm }]}
              />
            </Photo>
            <View style={styles.body}>
              <Intro stay={stay} />
              <Facts stay={stay} placeId={placeId} dates={dates} nights={nights} />
              <Details stay={stay} />
            </View>
          </>
        )}
      </AsyncView>
    </Screen>
  );
}

function Intro({ stay }: { stay: StayDetail }) {
  const reviews = [stay.scoreWord, stay.reviewCount && `${stay.reviewCount} reviews`]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.intro}>
      {stay.kind && <Badge label={stay.kind} />}
      <Text variant="title" accessibilityRole="header">
        {stay.name}
      </Text>
      {stay.score !== undefined && (
        <View style={styles.row}>
          <Icon name="star" size={16} />
          <Text weight="bold">{stay.score}</Text>
          {reviews !== '' && <Text color="textSecondary">· {reviews}</Text>}
        </View>
      )}
      {stay.starRating !== undefined && (
        <Text variant="label" weight="medium">
          {stay.starRating}-star {stay.kind?.toLowerCase() ?? 'stay'}
          {stay.area ? ` in ${stay.area}` : ''}
        </Text>
      )}
    </View>
  );
}

interface FactsProps {
  stay: StayDetail;
  placeId: string;
  dates?: DateRange;
  nights: number;
}

function Facts({ stay, placeId, dates, nights }: FactsProps) {
  const formatTemp = useTemperature();
  const current = useCurrentWeather(placeId);
  const daily = useDailyWeather(placeId, dates);

  const firstDay = daily.status === 'ready' ? daily.data[0] : undefined;
  const now = current.status === 'ready' ? current.data : undefined;
  const weather = firstDay
    ? { label: 'Weather on day 1', temperature: firstDay.high, condition: firstDay.condition }
    : now && { label: 'Weather now', ...now };

  // Prices depend on the nights: say what's missing rather than show a number.
  const price =
    nights < 1
      ? { value: 'Add dates to see' }
      : stay.nightly === undefined
        ? { value: 'No rooms those nights' }
        : {
            value: `${formatMoney(stay.nightly * nights)} for ${pluralize(nights, 'night')}`,
            note: `${formatMoney(stay.nightly)} a night`,
          };

  return (
    <View style={styles.facts}>
      <FactTile label="Price" value={price.value} note={price.note} />
      {stay.checkInFrom && <FactTile label="Check-in" value={`From ${stay.checkInFrom}`} />}
      {stay.checkOutUntil && <FactTile label="Check-out" value={`Until ${stay.checkOutUntil}`} />}
      {weather && (
        <FactTile
          label={weather.label}
          value={`${formatTemp(weather.temperature)} ${CONDITION_LABELS[weather.condition]}`}
          note={firstDay?.isTypical ? 'Typical weather' : undefined}
          icon={<Icon name={weather.condition} size={18} />}
        />
      )}
      {nights > 0 && stay.freeCancellation && (
        <FactTile label="Cancellation" value="Free cancellation" />
      )}
    </View>
  );
}

function Details({ stay }: { stay: StayDetail }) {
  const [allFacilities, setAllFacilities] = useState(false);
  const facilities = stay.facilities ?? [];
  const shownFacilities = allFacilities ? facilities : facilities.slice(0, FIRST_FACILITIES);
  const liked = stay.liked ?? [];
  const disliked = stay.disliked ?? [];
  const nearby = stay.nearby ?? [];
  const { websiteUrl, phone, mapsUrl } = stay;

  return (
    <>
      {stay.about && stay.about.length > 0 && (
        <Section title="About" tone="strong">
          {stay.about.map((paragraph, index) => (
            <Text key={index} color="textSecondary">
              {paragraph}
            </Text>
          ))}
          {stay.aboutCredit && (
            <Text variant="caption" color="textMuted">
              {stay.aboutCredit}
            </Text>
          )}
        </Section>
      )}
      {(liked.length > 0 || disliked.length > 0) && (
        <Section title="What guests say" tone="strong">
          {liked.length > 0 && (
            <Text color="textSecondary">
              <Text weight="semibold">Liked: </Text>
              {liked.join(', ')}
            </Text>
          )}
          {disliked.length > 0 && (
            <Text color="textSecondary">
              <Text weight="semibold">Not so good: </Text>
              {disliked.join(', ')}
            </Text>
          )}
          <Text variant="caption" color="textMuted">
            Summarized from guest reviews by LiteAPI
          </Text>
        </Section>
      )}
      {facilities.length > 0 && (
        <Section title="Amenities" tone="strong">
          <Text color="textSecondary">{shownFacilities.join(' · ')}</Text>
          {facilities.length > FIRST_FACILITIES && (
            <Button
              variant="plain"
              label={allFacilities ? 'Show fewer' : `Show all ${facilities.length}`}
              onPress={() => setAllFacilities((all) => !all)}
            />
          )}
        </Section>
      )}
      {stay.goodToKnow && stay.goodToKnow.length > 0 && (
        <Section title="Good to know" tone="strong">
          {stay.goodToKnow.map((note, index) => (
            <Text key={index} color="textSecondary">
              {note}
            </Text>
          ))}
        </Section>
      )}
      {(stay.address || stay.area) && (
        <Section title="Where it is" tone="strong">
          <MapView
            height={150}
            pins={[{ id: stay.id, label: `${stay.name} on the map`, position: { x: 0.5, y: 0.4 } }]}
          />
          {stay.address && <Text weight="semibold">{stay.address}</Text>}
          {stay.area && !stay.address && <Text color="textMuted">{stay.area}</Text>}
        </Section>
      )}
      {nearby.length > 0 && (
        <Section title="Close by" tone="strong">
          <ListGroup>
            {nearby.map((place) => (
              <ListRow key={place.name} title={place.name} value={place.distance} />
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
        {phone && (
          <Button
            variant="plain"
            label="Call"
            accessibilityLabel={`Call ${stay.name}`}
            onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}
          />
        )}
        {mapsUrl && (
          <Button
            variant="plain"
            icon="external"
            label="Open in Google Maps"
            onPress={() => Linking.openURL(mapsUrl)}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  photo: { height: 300 },
  back: { position: 'absolute', left: spacing.lg },
  body: { gap: spacing.xxl, padding: spacing.xl },
  intro: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
});
