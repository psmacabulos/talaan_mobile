/**
 * A feed row: what it shows, what a screen reader hears, and where pressing
 * it goes. A tap opens the child's day; a "another parent linked your child"
 * notice is marked read and stays on the feed.
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import { render, screen, userEvent } from "@testing-library/react-native";

import type { Notification } from "@/api/schemas";

import { FeedRow } from "../feed-row";

// Named `mock…` so Jest lets the mock factory below use it.
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// The section is passed in, so the date itself doesn't matter here.
const today = "2026-10-22";

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
  test("shows the sentence, with the time on the right", async () => {
    await render(<FeedRow item={tap} bucket="today" onRead={jest.fn()} />);

    expect(screen.getByText("Juan Cruz tapped in")).toBeOnTheScreen();
    expect(screen.getByText("7:56 AM")).toBeOnTheScreen();
    expect(screen.getByRole("button").props.accessibilityLabel).toBe(
      "Unread. Juan Cruz tapped in at 7:56 AM, today",
    );
  });

  test("marks it read and opens the child's day", async () => {
    const onRead = jest.fn();
    await render(<FeedRow item={tap} bucket="today" onRead={onRead} />);

    await userEvent.setup().press(screen.getByRole("button"));

    expect(onRead).toHaveBeenCalledWith("notification-1");
    expect(mockPush).toHaveBeenCalledWith("/child/student-0001");
  });

  test("says where it goes", async () => {
    await render(<FeedRow item={tap} bucket="today" onRead={jest.fn()} />);

    expect(screen.getByRole("button").props.accessibilityHint).toBe(
      "Opens Juan Cruz's day",
    );
  });
});

describe("another parent linked a child", () => {
  test("shows the sentence, the advice and the time", async () => {
    await render(<FeedRow item={notice} bucket="today" onRead={jest.fn()} />);

    expect(
      screen.getByText("An account named Ana Santos linked to Juan Cruz."),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("If you don't know them, contact the school."),
    ).toBeOnTheScreen();
    expect(screen.getByText("6:12 PM")).toBeOnTheScreen();
  });

  test("is read out in full, once", async () => {
    await render(<FeedRow item={notice} bucket="today" onRead={jest.fn()} />);

    expect(screen.getByRole("button").props.accessibilityLabel).toBe(
      "Unread. An account named Ana Santos linked to Juan Cruz. If you don't know them, contact the school. 6:12 PM, today",
    );
  });

  test("pressing it marks it read and stays on the feed", async () => {
    const onRead = jest.fn();
    await render(<FeedRow item={notice} bucket="today" onRead={onRead} />);

    await userEvent.setup().press(screen.getByRole("button"));

    expect(onRead).toHaveBeenCalledWith("notification-9");
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("once read, it is no longer a button", async () => {
    await render(
      <FeedRow
        item={{ ...notice, read: true }}
        bucket="today"
        onRead={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByText("An account named Ana Santos linked to Juan Cruz."),
    ).toBeOnTheScreen();
  });
});
