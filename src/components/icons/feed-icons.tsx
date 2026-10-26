/**
 * Icons for feed rows, drawn like the tab icons rather than installed.
 *
 * Decorative: every row already says in words what happened, so the icon is
 * hidden from screen readers and never carries the meaning alone
 * (docs/DESIGN.md, rule 3).
 */
import type { ColorValue } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

type FeedIconProps = {
  color: ColorValue;
  size?: number;
};

const STROKE = 1.8;

/** A person with a plus: another parent account was linked to a child. */
export function PersonPlusIcon({ color, size = 20 }: FeedIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={9} cy={8} r={4} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 8v6M16 11h6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
