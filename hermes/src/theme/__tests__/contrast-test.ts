import { darkColors, lightColors, type ColorName } from '../colors';

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PAGE: ColorName[] = ['background', 'surfaceSoft', 'surface', 'sheet'];

/** What is drawn on what. Add a row when you put text on a new surface. */
const TEXT: [ColorName, ColorName[]][] = [
  ['text', [...PAGE, 'raised']],
  ['textSecondary', PAGE],
  ['textMuted', [...PAGE, 'raised']],
  ['actionText', [...PAGE, 'raised', 'actionSoft']],
  ['danger', PAGE],
  ['onAction', ['action']],
  ['onSelected', ['selected']],
  ['text', ['actionSoft']],
  ['textOnFrame', ['frame', 'frameSurface', 'badge']],
  ['textOnFrameMuted', ['frame', 'frameSurface']],
  ['actionOnFrame', ['frame', 'frameSurface']],
];

/** Shapes you must be able to tell apart. */
const SHAPES: [ColorName, ColorName][] = [
  ['action', 'background'],
  ['action', 'sheet'],
  ['selected', 'background'],
  ['selected', 'sheet'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s palette', (_name, palette) => {
  it.each(TEXT.flatMap(([text, surfaces]) => surfaces.map((s) => [text, s] as const)))(
    '%s is readable on %s',
    (text, surface) => {
      expect(contrast(palette[text], palette[surface])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(SHAPES)('%s stands out from %s', (shape, surface) => {
    expect(contrast(palette[shape], palette[surface])).toBeGreaterThanOrEqual(3);
  });
});
