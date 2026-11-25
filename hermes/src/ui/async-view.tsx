import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useColors } from '@/theme';
import type { AsyncState } from '@/utils/use-async';

import { Message } from './message';

interface AsyncViewProps<T> {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
}

/** Draws loading and error states so screens only handle the ready one. */
export function AsyncView<T>({ state, children }: AsyncViewProps<T>) {
  const colors = useColors();
  if (state.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.action} accessibilityLabel="Loading" />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <Message
        testID="error-state"
        title="That didn't load"
        body={state.message}
        action={{ label: 'Try again', onPress: state.retry }}
      />
    );
  }
  return children(state.data);
}

const styles = StyleSheet.create({ loading: { padding: spacing.xxxl, alignItems: 'center' } });
