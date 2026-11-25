import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Button } from './button';
import { Text } from './text';

interface MessageProps {
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  testID?: string;
}

/** Empty and error states. */
export function Message({ title, body, action, testID }: MessageProps) {
  return (
    <View style={styles.box} testID={testID}>
      <Text variant="subheading" align="center">
        {title}
      </Text>
      {body && (
        <Text color="textMuted" align="center">
          {body}
        </Text>
      )}
      {action && <Button label={action.label} onPress={action.onPress} style={styles.action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  action: { marginTop: spacing.md, alignSelf: 'center', paddingHorizontal: spacing.xxl },
});
