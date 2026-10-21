/**
 * The Bantay Aral mark's geometry: a parent holding a child over an open
 * book, with the sun's rays.
 *
 * Copied verbatim from reference/mark-shapes.ts, which stays as the record of
 * what Talaan's web app draws — the two must keep matching. Only the shapes
 * are here. The colours live in src/theme/colors.ts as brand tokens, so this
 * file holds no colour literal (docs/DESIGN.md, rule 1).
 *
 * Draw order, which matters because the shapes overlap: parent head, parent
 * body (a gradient from parentTop down to parent), child head, the light
 * page, the child's page, the deep page, the two page edges (stroked), then
 * the three rays (stroked, round caps).
 */
export const MARK_VIEWBOX = "0 0 106 100";

export const MARK = {
  parentHead: { cx: 40, cy: 15, r: 11 },
  parentBody: "M62 49 C 56 35, 39 28, 25 34 C 7 42, 2 68, 18 82 C 26 89, 36 92, 47 97 C 46 91, 46 87, 48 83 Z",
  /** The parent figure's vertical gradient, in viewBox units, from parentTop down to parent. */
  parentGradient: { y1: 24, y2: 97 },
  childHead: { cx: 68, cy: 34, r: 10.5 },
  pageLight: "M50 82 C 52 72, 54 63, 54 57 C 46 49, 32 47, 24 51 C 19 55, 17 60, 16 65 C 30 64, 43 71, 50 82 Z",
  pageChild: "M50 82 C 53 71, 56 62, 59 55 C 67 49, 82 45, 93 43 C 93 52, 90 58, 86 61 C 72 63, 58 70, 50 82 Z",
  pageDeep: "M50 84 C 60 71, 76 63, 96 59 C 93 73, 75 85, 50 87 Z",
  edges: ["M13 67 C 30 65, 44 72, 50 83", "M50 83 C 58 70, 74 62, 97 58"],
  edgeWidth: 2.8,
  rays: ["M82 7 L 84 15", "M91 21 L 97 16", "M94 30 L 102 30"],
  rayWidth: 4.2,
} as const;
