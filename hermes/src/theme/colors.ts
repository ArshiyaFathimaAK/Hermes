/**
 * Every color in the app. Names say what a color is FOR, not what it looks like.
 * Rule from the design: black for structure, blue for action. If it's blue, you can tap it.
 */
export const colors = {
  background: '#FFFFFF',
  surface: '#F2F3F5',
  surfaceSoft: '#F5F7FB',
  inverse: '#0B0B0C',
  inverseSurface: '#1F2126',
  inverseBorder: '#2A2D34',

  text: '#0B0B0C',
  textSecondary: '#3B3F4A',
  textMuted: '#5B6070',
  textOnInverse: '#FFFFFF',
  textOnInverseMuted: '#C9CDD6',

  action: '#1D4ED8',
  actionSoft: '#E8EEFD',
  actionBorder: '#B7C6F5',
  actionOnInverse: '#A9BEFF',
  onAction: '#FFFFFF',

  border: '#E4E6EB',
  borderSubtle: '#EEF0F3',
  borderStrong: '#DADDE3',

  danger: '#B42318',

  photo: '#E3E9F8',
  photoOverlay: 'rgba(11,11,12,0.6)',
  mapLand: '#ECEFF4',
  mapWater: '#D6E0F7',
  scrim: 'rgba(11,11,12,0.55)',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;
