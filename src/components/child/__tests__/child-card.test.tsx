/**
 * A child's card through the day: before any tap, after the arrival, after
 * going home, and after leaving and coming back (docs/PRODUCT-RULES.md,
 * "The words to use").
 *
 * The last one is why the card shows the latest tap. With in, out, in the
 * server sends no time out, so a card that showed only "Time out" looked the
 * same as a child who arrived and never moved (Talaan Step 59.3).
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import { render, screen } from "@testing-library/react-native";

import type { ChildToday } from "@/api/schemas";
import { strings } from "@/strings";
import { status } from "@/theme";

import { ChildCard } from "../child-card";

// The photo reads the token for its header. No photo here, so no token.
jest.mock("@/api/token", () => ({ getTokenNow: () => null }));

// The phone's text size, which decides whether the times stack.
let mockLargeText = false;
jest.mock("@/lib/use-large-text", () => ({
  useLargeText: () => mockLargeText,
}));

beforeEach(() => {
  mockLargeText = false;
});

type Today = ChildToday["today"];

const IN_AT_7_12 = "2026-10-22T07:12:00.000+08:00";
const OUT_AT_4_05 = "2026-10-22T16:05:00.000+08:00";
const IN_AT_7_05_PM = "2026-10-22T19:05:00.000+08:00";

function child(today: Partial<Today>): ChildToday {
  return {
    id: "student-0002",
    firstName: "Jose",
    lastName: "Pascual",
    gradeLevel: 7,
    section: "Rizal",
    photo: null,
    school: {
      id: "school-balanga",
      name: "Balanga City National Science High School",
      notificationPreference: "time_in_and_time_out",
    },
    today: {
      date: "2026-10-22",
      status: "idle",
      flexible: false,
      timeIn: null,
      timeOut: null,
      tapCount: 0,
      latest: null,
      ...today,
    },
  };
}

async function renderCard(today: Partial<Today>) {
  await render(<ChildCard child={child(today)} onPress={jest.fn()} />);
}

/** Everything TalkBack reads for the card, in one string. */
function spoken(): string {
  return screen.getByRole("button").props.accessibilityLabel as string;
}

describe("before any tap", () => {
  test("shows a dash for the time in, and nothing about a time out", async () => {
    await renderCard({});

    expect(screen.getByText(strings.card.timeIn)).toBeOnTheScreen();
    expect(screen.getByText(strings.card.noTime)).toBeOnTheScreen();
    expect(screen.queryByText(strings.card.timeOut)).toBeNull();
  });

  test("its tile is grey, not a reassuring green beside a dash", async () => {
    await renderCard({});

    expect(screen.getByTestId("tile-timeIn")).toHaveStyle({
      backgroundColor: status.light.idle.text,
    });
  });
});

describe("with one tap", () => {
  test("shows the time in and nothing more", async () => {
    await renderCard({
      status: "present",
      timeIn: IN_AT_7_12,
      tapCount: 1,
      latest: { at: IN_AT_7_12, kind: "time_in" },
    });

    expect(screen.getByText("7:12 AM")).toBeOnTheScreen();
    expect(screen.queryByText("Out")).toBeNull();
    expect(screen.queryByText("Back in")).toBeNull();
    expect(screen.queryByText(strings.card.timeOut)).toBeNull();
  });
});

describe("in, then out", () => {
  const today: Partial<Today> = {
    status: "present",
    timeIn: IN_AT_7_12,
    timeOut: OUT_AT_4_05,
    tapCount: 2,
    latest: { at: OUT_AT_4_05, kind: "time_out" },
  };

  test("shows the time in, then 'Out 4:05 PM'", async () => {
    await renderCard(today);

    expect(screen.getByText("7:12 AM")).toBeOnTheScreen();
    expect(screen.getByText("Out")).toBeOnTheScreen();
    expect(screen.getByText("4:05 PM")).toBeOnTheScreen();
    expect(screen.queryByText(strings.card.timeOut)).toBeNull();
  });

  test("two taps is not 'N taps today'", async () => {
    await renderCard(today);

    expect(screen.queryByText(strings.card.tapsToday(2))).toBeNull();
  });

  test("is said in words to a screen reader", async () => {
    await renderCard(today);

    expect(spoken()).toContain("Time in 7:12 AM");
    expect(spoken()).toContain("Out at 4:05 PM");
  });
});

describe("in, out, then back in", () => {
  // The real case: 13 taps, the last a time in at 7:05 PM, no time out.
  const today: Partial<Today> = {
    status: "present",
    timeIn: "2026-10-22T11:09:00.000+08:00",
    timeOut: null,
    tapCount: 13,
    latest: { at: IN_AT_7_05_PM, kind: "time_in" },
  };

  test("shows 'Back in 7:05 PM', never a plain 'In'", async () => {
    await renderCard(today);

    expect(screen.getByText("11:09 AM")).toBeOnTheScreen();
    expect(screen.getByText("Back in")).toBeOnTheScreen();
    expect(screen.getByText("7:05 PM")).toBeOnTheScreen();
    expect(screen.queryByText("In")).toBeNull();
  });

  test("still says how many taps there were", async () => {
    await renderCard(today);

    expect(screen.getByText(strings.card.tapsToday(13))).toBeOnTheScreen();
  });

  test("is said in words to a screen reader, taps included", async () => {
    await renderCard(today);

    expect(spoken()).toContain("Back in at 7:05 PM");
    expect(spoken()).toContain(strings.card.tapsToday(13));
  });
});

describe("an older server, without the latest tap", () => {
  test("keeps the time in and time out, as before", async () => {
    await renderCard({
      status: "present",
      timeIn: IN_AT_7_12,
      timeOut: OUT_AT_4_05,
      tapCount: 2,
      latest: undefined,
    });

    expect(screen.getByText(strings.card.timeOut)).toBeOnTheScreen();
    expect(screen.getByText("4:05 PM")).toBeOnTheScreen();
    expect(screen.queryByText("Out")).toBeNull();
    expect(spoken()).toContain("Time out 4:05 PM");
  });
});

describe("the times panel", () => {
  const twoTaps: Partial<Today> = {
    status: "present",
    timeIn: IN_AT_7_12,
    timeOut: OUT_AT_4_05,
    tapCount: 2,
    latest: { at: OUT_AT_4_05, kind: "time_out" },
  };

  test("sits side by side at normal text sizes", async () => {
    await renderCard(twoTaps);

    expect(screen.getByTestId("times-panel")).toHaveStyle({
      flexDirection: "row",
    });
  });

  test("stacks at large text sizes, so no time is squeezed", async () => {
    mockLargeText = true;
    await renderCard(twoTaps);

    expect(screen.getByTestId("times-panel")).toHaveStyle({
      flexDirection: "column",
    });
  });

  test("an out wears blue, never the red that means Absent", async () => {
    await renderCard(twoTaps);

    expect(screen.getByTestId("tile-latest")).toHaveStyle({
      backgroundColor: status.light.timeOut.text,
    });
    expect(screen.getByTestId("tile-timeIn")).toHaveStyle({
      backgroundColor: status.light.present.text,
    });
  });
});
