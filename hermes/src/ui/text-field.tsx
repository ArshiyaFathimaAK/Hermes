import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, sizes, spacing, typography } from '@/theme';

import { Text } from './text';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
}

export function TextField({ label, error, ...input }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text variant="small" weight="semibold">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...input}
        style={[styles.input, error ? styles.invalid : null]}
      />
      {error && (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  input: {
    ...typography.label,
    fontFamily: typography.body.fontFamily,
    lineHeight: undefined,
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  invalid: { borderColor: colors.danger },
});
