import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Chip } from './chip';
import { Section } from './section';

export interface FilterSection {
  id: string;
  title: string;
  options: { value: string; label: string }[];
  /** Pick several instead of one. */
  multiple?: boolean;
  /** Hidden behind "More options" until asked for. */
  advanced?: boolean;
}

/** section id -> chosen option values. A missing or empty list means "any". */
export type FilterValues = Record<string, string[]>;

export const countFilters = (values: FilterValues) =>
  Object.values(values).filter((chosen) => chosen.length > 0).length;

interface FilterSheetProps {
  visible: boolean;
  sections: FilterSection[];
  values: FilterValues;
  resultCount: number;
  onChange: (values: FilterValues) => void;
  onClose: () => void;
}

/** Changes apply right away, so the button can say how many results are left. */
export function FilterSheet({
  visible,
  sections,
  values,
  resultCount,
  onChange,
  onClose,
}: FilterSheetProps) {
  const advanced = sections.filter((section) => section.advanced);
  const advancedCount = advanced.filter((section) => values[section.id]?.length).length;
  const [showMore, setShowMore] = useState(false);
  // Never hide a filter that is on.
  const expanded = showMore || advancedCount > 0;

  function toggle(section: FilterSection, value: string) {
    const chosen = values[section.id] ?? [];
    const on = chosen.includes(value);
    const next = on
      ? chosen.filter((v) => v !== value)
      : section.multiple
        ? [...chosen, value]
        : [value];
    onChange({ ...values, [section.id]: next });
  }

  const renderSection = (section: FilterSection) => (
    <Section key={section.id} title={section.title}>
      <View style={styles.options}>
        {section.options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={values[section.id]?.includes(option.value) ?? false}
            onPress={() => toggle(section, option.value)}
          />
        ))}
      </View>
    </Section>
  );

  return (
    <BottomSheet
      visible={visible}
      title="Filters"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button
            label="Clear all"
            variant="quiet"
            disabled={countFilters(values) === 0}
            onPress={() => onChange({})}
          />
          <Button
            label={resultCount === 1 ? 'Show 1 result' : `Show ${resultCount} results`}
            onPress={onClose}
            style={styles.apply}
          />
        </View>
      }>
      {sections.filter((section) => !section.advanced).map(renderSection)}
      {expanded && advanced.map(renderSection)}
      {advanced.length > 0 && advancedCount === 0 && (
        <Button
          variant="plain"
          label={expanded ? 'Fewer options' : 'More options'}
          icon={expanded ? 'chevronUp' : 'chevronDown'}
          onPress={() => setShowMore(!showMore)}
          style={styles.more}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  more: { alignSelf: 'flex-start' },
  footer: { flexDirection: 'row', gap: spacing.md },
  apply: { flex: 1 },
});
