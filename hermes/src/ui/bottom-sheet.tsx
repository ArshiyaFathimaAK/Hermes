import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { createStyles, radius, sizes, spacing } from '@/theme';

import { springs } from './motion';
import { SheetHeader } from './sheet-header';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Always visible below the scrolling content. */
  footer?: ReactNode;
}

/** Let go past this, or flick faster than this, and the sheet closes. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 800;

/** For quick choices inside one screen. Use a route when it should be linkable. */
export function BottomSheet({ visible, ...content }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={content.onClose}>
      {/* A modal is its own window, so it needs its own gesture root. */}
      <GestureHandlerRootView style={rootStyle}>
        <SheetContent {...content} />
      </GestureHandlerRootView>
    </Modal>
  );
}

const rootStyle = { flex: 1 };

/** Separate so the gesture is created together with the view it belongs to. */
function SheetContent({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: Omit<BottomSheetProps, 'visible'>) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(0);
  const height = useSharedValue(0);

  // Only the top of the sheet drags, so the content can still scroll.
  const drag = usePanGesture({
    activeOffsetY: 8,
    failOffsetX: [-20, 20],
    onUpdate: (event) => {
      'worklet';
      // Pulling up gives a little, then resists.
      offset.set(event.translationY > 0 ? event.translationY : event.translationY / 8);
    },
    onDeactivate: (event) => {
      'worklet';
      const closes =
        !event.canceled &&
        (event.translationY > CLOSE_DISTANCE ||
          (event.translationY > 0 && event.velocityY > CLOSE_VELOCITY));
      if (closes) {
        offset.set(
          withTiming(height.get(), { duration: 180 }, () => {
            'worklet';
            scheduleOnRN(onClose);
          }),
        );
      } else {
        offset.set(withSpring(0, springs.settle));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.root, { paddingTop: insets.top + spacing.xxxl }]}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.scrim]}
        onPress={onClose}
        accessible={false}
        importantForAccessibility="no"
      />
      <Animated.View entering={SlideInDown.duration(240)} style={styles.slide}>
        <Animated.View
          onLayout={(event) => height.set(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
            sheetStyle,
          ]}
          accessibilityViewIsModal>
          <GestureDetector gesture={drag} touchAction="none">
            <View style={styles.handle}>
              <View style={styles.grabber} />
              <SheetHeader title={title} subtitle={subtitle} onClose={onClose} />
            </View>
          </GestureDetector>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer}
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const useStyles = createStyles((colors) => ({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: colors.scrim },
  slide: { width: '100%', maxWidth: sizes.maxContentWidth, flexShrink: 1 },
  sheet: {
    // Shrinks to fit above the keyboard instead of hiding behind it.
    flexShrink: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    paddingTop: 0,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.sheet,
  },
  handle: { gap: spacing.xs, paddingTop: spacing.md },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.xl },
}));
