import type { TextStyle } from 'react-native';

/** Names registered by `useFonts` in src/app/_layout.tsx. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const typography = {
  /** Place name on the destination header. */
  hero: { fontFamily: fonts.extrabold, fontSize: 42, lineHeight: 46, letterSpacing: -1.2 },
  /** Screen titles. */
  title: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 37, letterSpacing: -0.9 },
  /** Sheet titles. */
  heading: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  /** Card titles and section headings. */
  subheading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  /** Row titles and buttons. */
  label: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  /** Quiet section labels, chips, metadata. */
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  /** Credits and source lines. */
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15 },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
