/**
 * Every color in the app. Names say what a color is FOR, not what it looks like.
 * Black is structure and blue is action: if it's blue, you can tap it.
 *
 * Both palettes must have the same names (TypeScript checks), and text must stay readable in both
 * (theme/__tests__/contrast-test.ts checks).
 */
export const lightColors = {
  // Surfaces, from the page up. In dark mode higher means lighter, since shadows don't show.
  background: '#FFFFFF',
  surfaceSoft: '#F5F7FB',
  surface: '#F2F3F5',
  sheet: '#FFFFFF',
  /** Floats above something: buttons on photos, the chosen segment, map pins. */
  raised: '#FFFFFF',

  // The dark blocks that frame a place or trip. They stay dark in both modes.
  frame: '#0B0B0C',
  frameSurface: '#1F2126',
  frameBorder: '#2A2D34',
  textOnFrame: '#FFFFFF',
  textOnFrameMuted: '#C9CDD6',
  actionOnFrame: '#A9BEFF',

  text: '#0B0B0C',
  textSecondary: '#3B3F4A',
  textMuted: '#5B6070',

  // Fill with action; write and draw with actionText.
  action: '#1D4ED8',
  onAction: '#FFFFFF',
  actionText: '#1D4ED8',
  actionSoft: '#E8EEFD',
  actionBorder: '#B7C6F5',

  // Labels that can't be tapped, then chosen chips and days.
  badge: '#0B0B0C',
  selected: '#0B0B0C',
  onSelected: '#FFFFFF',

  border: '#E4E6EB',
  borderSubtle: '#EEF0F3',
  borderStrong: '#DADDE3',

  danger: '#B42318',

  // Photos look the same in both modes, so what sits on them does too.
  photo: '#E3E9F8',
  photoOverlay: 'rgba(11,11,12,0.75)',
  textOnPhoto: '#FFFFFF',

  mapLand: '#ECEFF4',
  mapWater: '#D6E0F7',
  mapRoad: '#FFFFFF',

  scrim: 'rgba(11,11,12,0.55)',
};

export type ColorName = keyof typeof lightColors;
export type Colors = Record<ColorName, string>;

export const darkColors: Colors = {
  background: '#0E0F12',
  surfaceSoft: '#17191E',
  surface: '#1E2026',
  sheet: '#17191E',
  raised: '#30343E',

  frame: '#1C1E24',
  frameSurface: '#2C3039',
  frameBorder: '#383C47',
  textOnFrame: '#F4F5F7',
  textOnFrameMuted: '#B9BECA',
  actionOnFrame: '#A9BEFF',

  text: '#F4F5F7',
  textSecondary: '#CDD1DA',
  textMuted: '#A3A9B7',

  action: '#3B66E8',
  onAction: '#FFFFFF',
  actionText: '#9DB7FF',
  actionSoft: '#1A2748',
  actionBorder: '#4A64A8',

  badge: '#30343E',
  selected: '#F4F5F7',
  onSelected: '#0E0F12',

  border: '#2C2F38',
  borderSubtle: '#23262D',
  borderStrong: '#4A4E5A',

  danger: '#FF8A7A',

  photo: '#232A3D',
  photoOverlay: 'rgba(11,11,12,0.75)',
  textOnPhoto: '#FFFFFF',

  mapLand: '#1B1E25',
  mapWater: '#1C2C4F',
  mapRoad: '#3A3F4B',

  scrim: 'rgba(0,0,0,0.65)',
};
