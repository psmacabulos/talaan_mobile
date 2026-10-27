/**
 * The small icons on a child's card and its status pill, drawn to match the
 * owner's brand sheet (`design/BantayAral UI Brand Asset Sheet.png`) rather
 * than cropped from it: a picture of an icon is blurry on a sharp screen and
 * can't change colour for dark mode.
 *
 * All decorative: every one sits beside words that say the same thing, so
 * each is hidden from screen readers and never carries the meaning alone
 * (docs/DESIGN.md, rule 3).
 */
import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import { Circle, Path, Svg } from "react-native-svg";

type IconProps = {
  color: ColorValue;
  size?: number;
};

const STROKE = 2;

function Icon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}

/** An arrow going through a door: a time in. */
export function ArrowInIcon({ color, size = 20 }: IconProps) {
  return (
    <Icon size={size}>
      <Path
        d="M4 12h11M11 7l5 5-5 5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Icon>
  );
}

/** An arrow leaving a door: a time out. */
export function ArrowOutIcon({ color, size = 20 }: IconProps) {
  return (
    <Icon size={size}>
      <Path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M9 12h11M16 7l5 5-5 5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

/** A clock: late. */
export function ClockIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

/** A tick in a circle: present. */
export function CheckCircleIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="m8 12.5 2.5 2.5L16 9.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

/** An exclamation mark in a circle: absent. */
export function AlertCircleIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M12 7.5v5.5M12 16.5v.01"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Icon>
  );
}

/** "Opens more": the end of a card that leads somewhere. */
export function ChevronRightIcon({ color, size = 20 }: IconProps) {
  return (
    <Icon size={size}>
      <Path
        d="m9 6 6 6-6 6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}
