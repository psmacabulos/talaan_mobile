/**
 * The Notifications tab: sections with headers a screen reader can jump
 * between, and what the bottom of the list says — the end, or that older
 * ones failed to load while the newer ones stay.
 *
 * It lives here, not beside the screen: every file under src/app becomes a
 * route (docs/PROBLEMS-LOG.md, P-004). The feed's hooks are mocked, so
 * nothing reaches the network (P-008).
 *
 * `render` is async in React Native Testing Library v14 and must be awaited.
 */
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { Notification } from "@/api/schemas";
import NotificationsScreen from "@/app/(app)/(tabs)/notifications";
import { useFeed } from "@/feed/use-feed";
import { schoolDateOf } from "@/lib/school-time";
import { strings } from "@/strings";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/feed/use-feed", () => ({
  useFeed: jest.fn(),
  useMarkRead: () => ({ mutate: jest.fn() }),
  useMarkAllRead: () => ({ mutate: jest.fn(), isPending: false }),
}));

const useFeedMock = useFeed as jest.MockedFunction<typeof useFeed>;

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// The screen reads today from the clock, so the rows are built from it too.
const today = schoolDateOf(new Date().toISOString());

const row: Notification = {
  id: "notification-1",
  childId: "student-0001",
  childName: "Maria Ramos",
  kind: "time_in",
  at: `${today}T07:12:00.000+08:00`,
  read: true,
};

/** Only what the screen reads from the query, typed as the whole result. */
function feedState(state: Record<string, unknown>) {
  useFeedMock.mockReturnValue({
    data: {
      pages: [{ notifications: [row], unreadCount: 0, nextBefore: null }],
      pageParams: [undefined],
    },
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isRefetching: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...state,
  } as unknown as ReturnType<typeof useFeed>);
}

async function renderScreen() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <NotificationsScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("rows sit under a section header a screen reader can jump to", async () => {
  feedState({});
  await renderScreen();

  expect(
    screen.getByRole("header", { name: strings.feed.sectionToday }),
  ).toBeOnTheScreen();
  expect(screen.getByText("Maria Ramos tapped in")).toBeOnTheScreen();
  expect(screen.getByText("7:12 AM")).toBeOnTheScreen();
});

test("the last page says it's the end", async () => {
  feedState({ hasNextPage: false });
  await renderScreen();

  expect(screen.getByText(strings.feed.endOfFeed)).toBeOnTheScreen();
});

test("with more to load, it doesn't claim to be the end", async () => {
  feedState({ hasNextPage: true });
  await renderScreen();

  expect(screen.queryByText(strings.feed.endOfFeed)).toBeNull();
});

test("older ones failing keeps the rows, and offers to try again", async () => {
  const fetchNextPage = jest.fn();
  feedState({
    hasNextPage: true,
    isError: true,
    isFetchNextPageError: true,
    fetchNextPage,
  });
  await renderScreen();

  expect(screen.getByText("Maria Ramos tapped in")).toBeOnTheScreen();
  expect(screen.getByText(strings.feed.olderFailed)).toBeOnTheScreen();

  await userEvent.setup().press(screen.getByText(strings.errors.tryAgain));

  expect(fetchNextPage).toHaveBeenCalled();
});

test("after older ones fail, reaching the end doesn't ask again by itself", async () => {
  // Offline, the footer swapping between spinner and error fires the list's
  // end again; asking each time would loop. Only Try again asks.
  const fetchNextPage = jest.fn();
  feedState({
    hasNextPage: true,
    isError: true,
    isFetchNextPageError: true,
    fetchNextPage,
  });
  await renderScreen();

  await fireEvent(screen.getByTestId("feed-list"), "endReached");

  expect(fetchNextPage).not.toHaveBeenCalled();
});

test("reaching the end with more to load asks for them", async () => {
  const fetchNextPage = jest.fn();
  feedState({ hasNextPage: true, fetchNextPage });
  await renderScreen();

  await fireEvent(screen.getByTestId("feed-list"), "endReached");

  expect(fetchNextPage).toHaveBeenCalledTimes(1);
});
