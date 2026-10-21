/**
 * The type scale and the two font families (docs/DESIGN.md, "Type, space,
 * corners"). Never a one-off size: if a design needs something not here,
 * raise it rather than inventing a value.
 *
 * Lexend for headings and every number and time, because digits need to be
 * read at a glance. Atkinson Hyperlegible for everything else: it was drawn
 * to keep letters apart that are easy to confuse.
 *
 * Sizes are unscaled points. Font scaling is never turned off, so every
 * layout has to survive the phone's largest text setting.
 */

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
} as const;

export type FontSize = keyof typeof fontSize;

/**
 * The names expo-font registers. They must match the keys loaded in
 * src/app/_layout.tsx exactly, or text silently falls back to the system font.
 */
export const fontFamily = {
  /** Headings, numbers and times. */
  heading: "Lexend_600SemiBold",
  headingBold: "Lexend_700Bold",
  headingRegular: "Lexend_400Regular",
  /** Body text, labels, everything else. */
  body: "AtkinsonHyperlegible_400Regular",
  bodyBold: "AtkinsonHyperlegible_700Bold",
} as const;

export type FontFamily = keyof typeof fontFamily;

/** Line heights that keep text readable as it scales. */
export const lineHeight = {
  tight: 1.2,
  normal: 1.45,
} as const;
