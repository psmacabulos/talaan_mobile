/**
 * Space and corners (docs/DESIGN.md, "Type, space, corners"). A 4-point
 * scale, so everything lines up on a common grid.
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export type Space = keyof typeof space;

export const radius = {
  sm: 6,
  base: 8,
  md: 10,
  lg: 14,
} as const;

export type Radius = keyof typeof radius;

/**
 * The smallest a control may be. Android's floor is 48 and iOS's is 44, so
 * 48 everywhere satisfies both (docs/DESIGN.md, rule 5).
 */
export const MIN_TOUCH_TARGET = 48;
