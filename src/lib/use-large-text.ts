/**
 * Whether the parent has turned the phone's text size well up.
 *
 * Font scaling is never turned off in this app (CLAUDE.md, "UX quality bar"),
 * so a layout that sits side by side at normal sizes has to change shape when
 * the text is large: at 200%, a time like "10:04 AM" in Lexend bold is wider
 * than half a card. This is the one place that threshold lives.
 */
import { useWindowDimensions } from "react-native";

/** From here, side-by-side layouts stack. */
const LARGE_TEXT_FONT_SCALE = 1.3;

/** The rule itself, apart from the hook so it can be tested. */
export function isLargeText(fontScale: number): boolean {
  return fontScale >= LARGE_TEXT_FONT_SCALE;
}

export function useLargeText(): boolean {
  return isLargeText(useWindowDimensions().fontScale);
}
