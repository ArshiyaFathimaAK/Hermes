import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, radius, sizes, spacing } from '@/theme';

import { SheetHeader } from './sheet-header';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Always visible below the scrolling content. */
  footer?: ReactNode;
}

/** For quick choices inside one screen. Use a route when it should be linkable. */
export function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: BottomSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.root, { paddingTop: insets.top + spacing.xxxl }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
          accessibilityViewIsModal>
          <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createStyles((colors) => ({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    width: '100%',
    maxWidth: sizes.maxContentWidth,
    // Shrinks to fit above the keyboard instead of hiding behind it.
    flexShrink: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.sheet,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.xl },
}));
