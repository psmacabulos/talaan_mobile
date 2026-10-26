/**
 * A feed row: what it shows, what a screen reader hears, and where pressing
 * it goes. A tap opens the child's day; a "another parent linked your child"
 * notice is marked read and stays on the feed.
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import { render, screen, userEvent } from "@testing-library/react-native";

import type { Notification } from "@/api/schemas";
import { schoolDateOf } from "@/lib/school-time";

import { FeedRow } from "../feed-row";

// Named `mock…` so Jest lets the mock factory below use it.
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// Today on the school's clock, so neither row names a day.
const today = schoolDateOf(new Date().toISOString());

const tap: Notification = {
  id: "notification-1",
  childId: "student-0001",
  childName: "Juan Cruz",
  kind: "time_in",
  at: `${today}T07:56:00.000+08:00`,
  read: false,
};

const notice: Notification = {
  id: "notification-9",
  childId: "student-0001",
  childName: "Juan Cruz",
  kind: "guardian_linked",
  at: `${today}T18:12:00.000+08:00`,
  read: false,
  guardian: { firstName: "Ana", lastName: "Santos" },
};

describe("a tap", () => {
  test("marks it read and opens the child's day", async () => {
    const onRead = jest.fn();
    await render(<FeedRow item={tap} onRead={onRead} />);

    await userEvent.setup().press(screen.getByRole("button"));

    expect(onRead).toHaveBeenCalledWith("notification-1");
    expect(mockPush).toHaveBeenCalledWith("/child/student-0001");
  });

  test("says where it goes", async () => {
    await render(<FeedRow item={tap} onRead={jest.fn()} />);

    expect(screen.getByRole("button").props.accessibilityHint).toBe(
      "Opens Juan Cruz's day",
    );
  });
});

describe("another parent linked a child", () => {
  test("shows the sentence, the advice and the time", async () => {
    await render(<FeedRow item={notice} onRead={jest.fn()} />);

    expect(
      screen.getByText("An account named Ana Santos linked to Juan Cruz."),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("If you don't know them, contact the school."),
    ).toBeOnTheScreen();
    expect(screen.getByText("6:12 PM")).toBeOnTheScreen();
  });

  test("is read out in full, once", async () => {
    await render(<FeedRow item={notice} onRead={jest.fn()} />);

    expect(screen.getByRole("button").props.accessibilityLabel).toBe(
      "Unread. An account named Ana Santos linked to Juan Cruz. If you don't know them, contact the school. 6:12 PM",
    );
  });

  test("pressing it marks it read and stays on the feed", async () => {
    const onRead = jest.fn();
    await render(<FeedRow item={notice} onRead={onRead} />);

    await userEvent.setup().press(screen.getByRole("button"));

    expect(onRead).toHaveBeenCalledWith("notification-9");
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("once read, it is no longer a button", async () => {
    await render(
      <FeedRow item={{ ...notice, read: true }} onRead={jest.fn()} />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByText("An account named Ana Santos linked to Juan Cruz."),
    ).toBeOnTheScreen();
  });
});
