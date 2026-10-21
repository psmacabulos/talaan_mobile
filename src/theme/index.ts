/**
 * One typed way into the design system. Components call `useTheme()` and read
 * token names from it; they never import a colour map directly and never
 * write a literal (docs/DESIGN.md, rule 1).
 *
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.colors.card, padding: theme.space.base }} />
 *
 * Light and dark follow the phone's own setting (docs/DESIGN.md, rule 6), so
 * there is no in-app theme switch to build or remember.
 */
import { useColorScheme } from "react-native";

import {
  brand,
  semantic,
  status,
  type BrandColors,
  type ColorScheme,
  type SemanticColors,
  type StatusColors,
  type StatusName,
} from "./colors";
import { fontFamily, fontSize, lineHeight } from "./typography";
import { MIN_TOUCH_TARGET, radius, space } from "./space";

export type Theme = {
  scheme: ColorScheme;
  colors: SemanticColors;
  status: Record<StatusName, StatusColors>;
  brand: BrandColors;
  fontSize: typeof fontSize;
  fontFamily: typeof fontFamily;
  lineHeight: typeof lineHeight;
  space: typeof space;
  radius: typeof radius;
  minTouchTarget: typeof MIN_TOUCH_TARGET;
};

function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: semantic[scheme],
    status: status[scheme],
    brand: brand[scheme],
    fontSize,
    fontFamily,
    lineHeight,
    space,
    radius,
    minTouchTarget: MIN_TOUCH_TARGET,
  };
}

/**
 * Both themes are built once, at module load. `useTheme()` then hands back the
 * same object every render, so a screen full of cards (M5) never re-renders
 * just because the theme looked new.
 */
const THEMES: Record<ColorScheme, Theme> = {
  light: buildTheme("light"),
  dark: buildTheme("dark"),
};

/** The phone's scheme, falling back to light when it doesn't say. */
export function useColorSchemeName(): ColorScheme {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useTheme(): Theme {
  return THEMES[useColorSchemeName()];
}

export { brand, ICON_BACKGROUND, semantic, status } from "./colors";
export type {
  BrandColors,
  ColorScheme,
  SemanticColors,
  StatusColors,
  StatusName,
} from "./colors";
export { fontFamily, fontSize, lineHeight } from "./typography";
export type { FontFamily, FontSize } from "./typography";
export { MIN_TOUCH_TARGET, radius, space } from "./space";
export type { Radius, Space } from "./space";
