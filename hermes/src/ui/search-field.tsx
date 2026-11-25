import { TextInput, View } from 'react-native';

import { createStyles, radius, sizes, spacing, typography, useColors } from '@/theme';

import { Icon } from './icon';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  testID?: string;
}

export function SearchField({ label, placeholder, value, onChangeText, testID }: SearchFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.box, value ? styles.active : null]}>
      <Icon name="search" />
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={styles.input}
      />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  active: { borderColor: colors.actionText },
  input: {
    ...typography.label,
    fontFamily: typography.body.fontFamily,
    lineHeight: undefined,
    flex: 1,
    minWidth: 0,
    minHeight: sizes.touch,
    color: colors.text,
    outlineWidth: 0,
  },
}));
