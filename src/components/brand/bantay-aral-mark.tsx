/**
 * The Bantay Aral mark, drawn as vectors so it stays sharp at any size and in
 * either theme. Never a screenshot of the logo (docs/DESIGN.md, "The logo").
 *
 * Decorative on its own: the label lives on <Logo>, so a screen reader says
 * "Bantay Aral" once instead of describing a picture.
 */
import { useId } from "react";

import {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from "react-native-svg";

import { useTheme } from "@/theme";

import { MARK, MARK_VIEWBOX } from "./mark-shapes";

type BantayAralMarkProps = {
  /** Height and width in points. The mark is square. */
  size?: number;
};

export function BantayAralMark({ size = 48 }: BantayAralMarkProps) {
  const { brand } = useTheme();
  // Two marks can share a screen (M5: a header logo above child cards). A
  // fixed id would let the second mark pick up the first mark's gradient.
  // React's ids contain colons, which are invalid inside url(#...).
  const gradientId = `parent-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="0"
          y1={MARK.parentGradient.y1}
          x2="0"
          y2={MARK.parentGradient.y2}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={brand.parentTop} />
          <Stop offset="1" stopColor={brand.parent} />
        </LinearGradient>
      </Defs>

      <Circle
        cx={MARK.parentHead.cx}
        cy={MARK.parentHead.cy}
        r={MARK.parentHead.r}
        fill={brand.parentTop}
      />
      <Path d={MARK.parentBody} fill={`url(#${gradientId})`} />
      <Circle
        cx={MARK.childHead.cx}
        cy={MARK.childHead.cy}
        r={MARK.childHead.r}
        fill={brand.child}
      />

      <Path d={MARK.pageLight} fill={brand.pageLight} />
      <Path d={MARK.pageChild} fill={brand.child} />
      <Path d={MARK.pageDeep} fill={brand.pageDeep} />

      {MARK.edges.map((edge) => (
        <Path
          key={edge}
          d={edge}
          stroke={brand.edge}
          strokeWidth={MARK.edgeWidth}
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {MARK.rays.map((ray) => (
        <Path
          key={ray}
          d={ray}
          stroke={brand.sun}
          strokeWidth={MARK.rayWidth}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}
