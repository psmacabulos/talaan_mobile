/**
 * The open tab's icon is filled and the others are outlines, as in the owner's
 * design, so which tab is open doesn't rest on colour alone (docs/DESIGN.md,
 * rule 3).
 *
 * The icons are hidden from screen readers, so every query includes hidden
 * elements. react-native-svg hands its native view a processed colour, so the
 * test compares the fill with the stroke rather than with the colour itself.
 */
import { render, screen } from "@testing-library/react-native";

import { semantic } from "@/theme";

import { BellIcon, HomeIcon } from "../tab-icons";

const COLOR = semantic.light.primary;

function shape(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

describe.each([
  ["the house", HomeIcon, "home-icon-shape"],
  ["the bell", BellIcon, "bell-icon-shape"],
] as const)("%s", (_name, Icon, testID) => {
  test("is filled with the tab's colour when its tab is open", async () => {
    await render(<Icon color={COLOR} focused />);

    expect(shape(testID).props.fill).toEqual(shape(testID).props.stroke);
  });

  test("is an outline when its tab is not open", async () => {
    await render(<Icon color={COLOR} />);

    // react-native-svg turns `fill="none"` into null on the native view.
    expect(shape(testID).props.fill).toBeNull();
    expect(shape(testID).props.stroke).not.toBeNull();
  });
});
