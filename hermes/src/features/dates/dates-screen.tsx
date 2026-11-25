import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { goBack } from '@/navigation/routes';
import { spacing } from '@/theme';
import { AsyncView } from '@/ui/async-view';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { FooterBar, Screen } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';

import { Calendar } from './calendar';
import { getDatePresets } from './date-presets';
import { ForecastCard } from './forecast-card';
import { useDatePicker } from './use-date-picker';

export function DatesScreen({ placeId }: { placeId: string }) {
  const { month, setMonth, range, pickDay, dragRange, pickPreset, forecast, save } =
    useDatePicker(placeId);
  const [presets] = useState(getDatePresets);

  return (
    <Screen
      testID="dates-screen"
      footer={
        <FooterBar>
          <Button
            testID="save-dates"
            label="Save dates"
            disabled={!range}
            onPress={() => {
              save();
              goBack();
            }}
            style={styles.save}
          />
        </FooterBar>
      }>
      <SheetHeader
        title="When are you going?"
        subtitle="Optional. Dates add a forecast, opening hours for those days, and stay prices."
        onClose={goBack}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presets}
        contentContainerStyle={styles.presetRow}>
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            onPress={() => pickPreset(preset.range)}
          />
        ))}
      </ScrollView>
      <Calendar
        month={month}
        onChangeMonth={setMonth}
        range={range}
        onPickDay={pickDay}
        onDragRange={dragRange}
      />
      {range && (
        <AsyncView state={forecast}>
          {(days) => <ForecastCard range={range} days={days} />}
        </AsyncView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  save: { flex: 1 },
  presets: { flexGrow: 0, marginHorizontal: -spacing.xl },
  presetRow: { gap: spacing.sm, paddingHorizontal: spacing.xl },
});
