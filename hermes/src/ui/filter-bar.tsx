import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { Chip } from './chip';
import { FilterSheet, countFilters, type FilterSection, type FilterValues } from './filter-sheet';

interface FilterBarProps {
  /** One-tap choices, always visible. */
  quick?: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  };
  sections: FilterSection[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  resultCount: number;
}

/** Quick chips in a row, with everything else behind one Filters chip. */
export function FilterBar({ quick, sections, values, onChange, resultCount }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const count = countFilters(values);
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Chip
          testID="open-filters"
          icon="filters"
          label={count > 0 ? `Filters · ${count}` : 'Filters'}
          accessibilityLabel={count > 0 ? `Filters, ${count} on` : 'Filters'}
          selected={count > 0}
          onPress={() => setOpen(true)}
        />
        {quick?.options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === quick.value}
            onPress={() => quick.onChange(option.value)}
          />
        ))}
      </ScrollView>
      <FilterSheet
        visible={open}
        sections={sections}
        values={values}
        onChange={onChange}
        resultCount={resultCount}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
});
