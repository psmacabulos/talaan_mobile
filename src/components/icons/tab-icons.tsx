/**
 * The two tab icons, drawn rather than installed.
 *
 * `react-native-svg` is already here for the logo, so two shapes do not
 * justify an icon-font package — those ship several whole typefaces and every
 * one of them lands in the APK a parent downloads over mobile data.
 *
 * Both take the colour React Navigation hands them, so the active and
 * inactive tints come from `src/theme` like everything else, and both are
 * decorative: the tab already has a label and, for Notifications, a
 * screen-reader label naming the unread count.
 */
import type { ColorValue } from "react-native";
import { Path, Svg } from "react-native-svg";

type TabIconProps = {
  /** React Navigation passes the active or inactive tint. */
  color: ColorValue;
  size?: number;
};

const STROKE = 1.8;

/** A house: the children a parent came to see. */
export function HomeIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** A bell: something happened at the gate. */
export function BellIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M10.3 18a2 2 0 0 0 3.4 0"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
