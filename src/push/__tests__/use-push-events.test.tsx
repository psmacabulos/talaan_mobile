/**
 * What the app does with a push: one arriving refreshes the screens, and
 * tapping one marks it read, then opens the feed at it. A link notice is
 * handled the same way, never as a tap that opens a child's day.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { markNotificationRead } from "@/api/endpoints";

import { onPushReceived, onPushTapped, type PushData } from "../notifications";
import { usePushEvents } from "../use-push-events";

// Named "mock…": jest only lets a mock factory reach variables named so.
const mockRouter = {
  canDismiss: jest.fn(),
  dismissAll: jest.fn(),
  navigate: jest.fn(),
};

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/api/endpoints", () => ({ markNotificationRead: jest.fn() }));
jest.mock("../notifications", () => ({
  onPushReceived: jest.fn(),
  onPushTapped: jest.fn(),
}));

const markRead = jest.mocked(markNotificationRead);
const stopReceiving = jest.fn();
const stopTapping = jest.fn();
let receive: (data: PushData | null) => void = () => {};
let tap: (data: PushData | null) => void = () => {};

const tapIn: PushData = {
  notificationId: "notification-0001",
  childId: "student-0001",
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function invalidatedKeys(spy: jest.SpyInstance) {
  return spy.mock.calls.map(([filters]) => filters.queryKey);
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient();
  mockRouter.canDismiss.mockReturnValue(false);
  markRead.mockResolvedValue(undefined);
  jest.mocked(onPushReceived).mockImplementation((onReceive) => {
    receive = onReceive;
    return stopReceiving;
  });
  jest.mocked(onPushTapped).mockImplementation((onTap) => {
    tap = onTap;
    return stopTapping;
  });
});

test("a push arriving refreshes Home, the feed, the badge and that child", async () => {
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => receive(tapIn));

  expect(invalidatedKeys(invalidate)).toEqual([
    ["parent", "me"],
    ["notifications", "unread"],
    ["notifications", "feed"],
    ["child", "student-0001"],
  ]);
  expect(mockRouter.navigate).not.toHaveBeenCalled();
});

test("a tap opens the feed at its notification", async () => {
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => tap(tapIn));

  expect(mockRouter.navigate).toHaveBeenCalledWith({
    pathname: "/notifications",
    params: { focus: "notification-0001" },
  });
  expect(mockRouter.dismissAll).not.toHaveBeenCalled();
});

test("a tap over a child's day closes it first, so Back goes Home", async () => {
  mockRouter.canDismiss.mockReturnValue(true);
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => tap(tapIn));

  expect(mockRouter.dismissAll).toHaveBeenCalled();
  expect(mockRouter.dismissAll.mock.invocationCallOrder[0]).toBeLessThan(
    mockRouter.navigate.mock.invocationCallOrder[0],
  );
});

test("a tap marks it read, then refreshes, so the row isn't shown unread", async () => {
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => tap(tapIn));

  expect(markRead).toHaveBeenCalledWith("notification-0001");
  expect(markRead.mock.invocationCallOrder[0]).toBeLessThan(
    invalidate.mock.invocationCallOrder[0],
  );
  expect(invalidatedKeys(invalidate)).toContainEqual(["notifications", "feed"]);
});

test("a read mark that fails still opens and refreshes the feed", async () => {
  markRead.mockRejectedValue(new Error("offline"));
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => tap(tapIn));

  expect(mockRouter.navigate).toHaveBeenCalled();
  expect(invalidatedKeys(invalidate)).toContainEqual(["notifications", "feed"]);
});

test("a link notice opens the feed like any other, never a child's day (P-013)", async () => {
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () =>
    tap({ notificationId: "notification-0009", childId: "student-0001" }),
  );

  expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
  expect(mockRouter.navigate).toHaveBeenCalledWith({
    pathname: "/notifications",
    params: { focus: "notification-0009" },
  });
});

test("a tap whose data can't be read opens the feed at the top", async () => {
  await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => tap(null));

  expect(mockRouter.navigate).toHaveBeenCalledWith({
    pathname: "/notifications",
    params: {},
  });
  expect(markRead).not.toHaveBeenCalled();
});

test("stops listening when the signed-in screens go away", async () => {
  const { unmount } = await renderHook(() => usePushEvents(), { wrapper });

  await act(async () => unmount());

  expect(stopReceiving).toHaveBeenCalled();
  expect(stopTapping).toHaveBeenCalled();
});
