import { useEffect, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { createStyles, radius, shadows, sizes, spacing } from '@/theme';

import { springs } from './motion';
import { Tappable } from './tappable';
import { Text } from './text';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

interface SegmentLayout {
  x: number;
  width: number;
}

/** Tap a segment, or drag the thumb. Dragging applies when you let go. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [layouts, setLayouts] = useState<Record<number, SegmentLayout>>({});
  const [hovered, setHovered] = useState<number>();
  const highlighted = hovered ?? selectedIndex;

  const segments = options.map((_, i) => layouts[i]).filter(Boolean);
  const measured = segments.length === options.length;
  const selected = measured ? segments[selectedIndex] : undefined;
  const selectedX = selected?.x;
  const selectedWidth = selected?.width;

  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const scale = useSharedValue(1);
  const dragStart = useSharedValue(0);
  const nearest = useSharedValue(selectedIndex);

  useEffect(() => {
    if (selectedX === undefined || selectedWidth === undefined) return;
    // The first position isn't animated.
    const first = width.get() === 0;
    x.set(first ? selectedX : withSpring(selectedX, springs.settle));
    width.set(first ? selectedWidth : withSpring(selectedWidth, springs.settle));
  }, [selectedX, selectedWidth, x, width]);

  // Browsers send a click to where a drag began. This tells it apart from a tap.
  const dragged = useRef(false);
  const setDragged = (value: boolean) => {
    dragged.current = value;
  };

  const commit = (index: number) => {
    setHovered(undefined);
    if (index !== selectedIndex) onChange(options[index].value);
  };

  const dragTo = (translationX: number) => {
    'worklet';
    const first = segments[0];
    const last = segments[segments.length - 1];
    const left = Math.min(Math.max(dragStart.get() + translationX, first.x), last.x);
    x.set(left);
    const center = left + width.get() / 2;
    let index = 0;
    for (let i = 1; i < segments.length; i++) {
      // Past halfway between two segments' centers.
      const before = segments[i - 1].x + segments[i - 1].width / 2;
      const after = segments[i].x + segments[i].width / 2;
      if (center >= (before + after) / 2) index = i;
    }
    if (index !== nearest.get()) {
      nearest.set(index);
      width.set(withSpring(segments[index].width, springs.settle));
      scheduleOnRN(setHovered, index);
    }
    return index;
  };

  const pan = usePanGesture({
    enabled: measured,
    // Vertical movement still scrolls the page.
    activeOffsetX: [-6, 6],
    failOffsetY: [-12, 12],
    onBegin: () => {
      'worklet';
      scheduleOnRN(setDragged, false);
    },
    onActivate: () => {
      'worklet';
      scheduleOnRN(setDragged, true);
      dragStart.set(segments[selectedIndex].x);
      nearest.set(selectedIndex);
      scale.set(withSpring(0.95, springs.settle));
    },
    onUpdate: (event) => {
      'worklet';
      dragTo(event.translationX);
    },
    onDeactivate: (event) => {
      'worklet';
      // A quick flick can end without an update, so work it out again here.
      const index = event.canceled ? selectedIndex : dragTo(event.translationX);
      x.set(withSpring(segments[index].x, springs.settle));
      width.set(withSpring(segments[index].width, springs.settle));
      scheduleOnRN(commit, index);
    },
    onFinalize: () => {
      'worklet';
      scale.set(withSpring(1, springs.settle));
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    width: width.get(),
    transform: [{ translateX: x.get() }, { scale: scale.get() }],
  }));

  const measure = (index: number) => (event: LayoutChangeEvent) => {
    const { x: left, width: size } = event.nativeEvent.layout;
    setLayouts((current) =>
      current[index]?.x === left && current[index]?.width === size
        ? current
        : { ...current, [index]: { x: left, width: size } },
    );
  };

  return (
    <GestureDetector gesture={pan} touchAction="pan-y">
      <View style={styles.track} accessibilityRole="tablist" accessibilityLabel={label}>
        {measured && <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />}
        {options.map((option, index) => {
          const isHighlighted = index === highlighted;
          return (
            <Tappable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: option.value === value }}
              onLayout={measure(index)}
              onPress={() => {
                if (!dragged.current) onChange(option.value);
              }}
              style={[styles.segment, !measured && isHighlighted && styles.selected]}>
              <Text weight="semibold" color={isHighlighted ? 'text' : 'textMuted'}>
                {option.label}
              </Text>
            </Tappable>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const useStyles = createStyles((colors) => ({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  segment: {
    flexGrow: 1,
    flexBasis: 'auto',
    minWidth: sizes.control,
    minHeight: sizes.touch,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.raised,
    ...shadows.low,
  },
  selected: { backgroundColor: colors.raised, ...shadows.low },
}));
