/**
 * Every pair of colours a parent reads, checked against WCAG 2.2 AA
 * (docs/DESIGN.md, rule 4): 4.5:1 for normal text, 3:1 for large text and
 * for the edges of controls.
 *
 * This runs in CI, so a colour that fails can never reach a phone. If a new
 * design value fails here, that's the finding — raise it rather than lowering
 * the threshold.
 */
import {
  brand,
  semantic,
  status,
  type ColorScheme,
  type StatusColors,
} from "./colors";

const AA_TEXT = 4.5;
const AA_LARGE = 3;

/** One sRGB channel, straightened out so luminance can be added up. */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = channel(parseInt(h.slice(0, 2), 16));
  const g = channel(parseInt(h.slice(2, 4), 16));
  const b = channel(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** How far apart two colours are, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const schemes: ColorScheme[] = ["light", "dark"];

describe.each(schemes)("%s theme", (scheme: ColorScheme) => {
  const colors = semantic[scheme];

  const textPairs: [string, string, string][] = [
    ["main text on the screen", colors.foreground, colors.background],
    ["main text on a card", colors.foreground, colors.card],
    ["secondary text on the screen", colors.mutedForeground, colors.background],
    ["secondary text on a card", colors.mutedForeground, colors.card],
    ["secondary text on a quiet surface", colors.mutedForeground, colors.muted],
    ["text on a main button", colors.primaryForeground, colors.primary],
    ["a link on the screen", colors.link, colors.background],
    ["a link on a card", colors.link, colors.card],
    ["sign out on the screen", colors.destructive, colors.background],
    ["sign out on a card", colors.destructive, colors.card],
    ["the wordmark's ink on the screen", brand[scheme].ink, colors.background],
    [
      "green brand text on the screen",
      brand[scheme].greenText,
      colors.background,
    ],
    ["green brand text on a card", brand[scheme].greenText, colors.card],
  ];

  test.each(textPairs)(
    "%s reads at AA",
    (_name: string, text: string, background: string) => {
      expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  const statusPairs: [string, StatusColors][] = Object.entries(
    status[scheme],
  );

  test.each(statusPairs)(
    "the %s pill reads at AA",
    (_name: string, pill: StatusColors) => {
      expect(contrastRatio(pill.text, pill.background)).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    },
  );

  // The tiles beside a child's times: a status colour's `text` as the fill,
  // the card colour for the icon (src/components/icon-tile.tsx). Icons are
  // graphics, so 3:1 (WCAG 1.4.11), and the tile must stand out from the
  // panel it sits on.
  const tiles: [string, string][] = [
    ["time in", status[scheme].present.text],
    ["time out", status[scheme].timeOut.text],
    ["no time yet", status[scheme].idle.text],
  ];

  test.each(tiles)("the %s tile's icon is visible", (_name, tile) => {
    expect(contrastRatio(colors.card, tile)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  test.each(tiles)("the %s tile stands out from its panel", (_name, tile) => {
    expect(contrastRatio(tile, colors.muted)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  test("a time reads on its panel", () => {
    expect(
      contrastRatio(colors.foreground, colors.muted),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  test("a main button stands out from the screen", () => {
    expect(
      contrastRatio(colors.primary, colors.background),
    ).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
