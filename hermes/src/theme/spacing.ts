export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const sizes = {
  /** Smallest comfortable touch target. */
  touch: 44,
  control: 52,
  tabBar: 60,
  hairline: 1,
  /** Keeps phone layouts readable on tablets and web. */
  maxContentWidth: 640,
} as const;
