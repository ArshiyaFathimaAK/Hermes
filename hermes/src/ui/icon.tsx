import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useColors, type ColorName } from '@/theme';

// iOS uses SF Symbols; Android and web use Material Symbols.
const ICONS = {
  add: pair('plus', 'add'),
  back: pair('chevron.left', 'chevron_left'),
  bed: pair('bed.double', 'bed'),
  calendar: pair('calendar', 'calendar_today'),
  check: pair('checkmark', 'check'),
  chevronDown: pair('chevron.down', 'keyboard_arrow_down'),
  chevronRight: pair('chevron.right', 'chevron_right'),
  chevronUp: pair('chevron.up', 'keyboard_arrow_up'),
  clock: pair('clock', 'schedule'),
  close: pair('xmark', 'close'),
  cloudy: pair('cloud', 'cloud'),
  directions: pair('arrow.triangle.turn.up.right.diamond', 'directions'),
  external: pair('arrow.up.right', 'open_in_new'),
  filters: pair('slider.horizontal.3', 'tune'),
  person: pair('person', 'person'),
  pin: pair('mappin.and.ellipse', 'location_on'),
  rainy: pair('cloud.rain', 'rainy'),
  search: pair('magnifyingglass', 'search'),
  share: pair('square.and.arrow.up', 'share'),
  star: pair('star.fill', 'star'),
  sunny: pair('sun.max', 'sunny'),
  trips: pair('point.topleft.down.to.point.bottomright.curvepath', 'route'),
} as const;

type SymbolNames = Exclude<SymbolViewProps['name'], string>;

function pair(ios: SymbolNames['ios'], other: SymbolNames['android']): SymbolNames {
  return { ios, android: other, web: other };
}

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorName;
}

/** Decorative: put the label on the thing you press. */
export function Icon({ name, size = 20, color = 'text' }: IconProps) {
  const colors = useColors();
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={colors[color]}
      style={{ width: size, height: size }}
    />
  );
}
