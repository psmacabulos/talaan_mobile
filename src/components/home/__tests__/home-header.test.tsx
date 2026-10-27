/**
 * The top of Home: the logo, "My children" and its line, and the school
 * beside them (docs/PLAN.md, Step M6.4b).
 *
 * What a screen reader hears matters as much as what shows: the logo once,
 * then the heading, then the line, and never the picture.
 */
import { render, screen } from "@testing-library/react-native";

import { strings } from "@/strings";

import { HomeHeader } from "../home-header";

// The phone's text size, which decides whether the picture fits.
let mockLargeText = false;
jest.mock("@/lib/use-large-text", () => ({
  useLargeText: () => mockLargeText,
}));

beforeEach(() => {
  mockLargeText = false;
});

test("says Bantay Aral once, as the logo", async () => {
  await render(<HomeHeader />);

  expect(
    screen.getAllByRole("image", { name: strings.brand.logoLabel }),
  ).toHaveLength(1);
});

test("has 'My children' as the screen's heading, and the line under it", async () => {
  await render(<HomeHeader />);

  expect(
    screen.getByRole("header", { name: strings.home.heading }),
  ).toBeOnTheScreen();
  expect(screen.getByText(strings.home.subheading)).toBeOnTheScreen();
});

test("keeps the heading clear of the school, so it wraps rather than overlap", async () => {
  await render(<HomeHeader />);

  expect(
    screen.getByRole("header", { name: strings.home.heading }),
  ).toHaveStyle({ paddingRight: 128 });
});

test("shows the school, hidden from screen readers", async () => {
  await render(<HomeHeader />);

  // Not found without hidden elements: TalkBack never stops on it.
  expect(screen.queryByTestId("home-illustration")).toBeNull();
  expect(
    screen.getByTestId("home-illustration", { includeHiddenElements: true }),
  ).toBeOnTheScreen();
});

test("leaves the school out at large text sizes, so the heading has room", async () => {
  mockLargeText = true;
  await render(<HomeHeader />);

  expect(
    screen.queryByTestId("home-illustration", { includeHiddenElements: true }),
  ).toBeNull();
  expect(
    screen.getByRole("header", { name: strings.home.heading }),
  ).toHaveStyle({ paddingRight: 0 });
});
