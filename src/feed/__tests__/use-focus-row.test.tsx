/**
 * The feed scrolling to the notification a tapped push named, and letting go
 * of it once it's found, or once a fetch after the tap has ended without it.
 */
import { act, renderHook } from "@testing-library/react-native";

import type { Notification } from "@/api/schemas";

import { groupFeed, type FeedSection } from "../feed-groups";
import { useFocusRow } from "../use-focus-row";

// Named "mock…": jest only lets a mock factory reach variables named so.
const mockRouter = { setParams: jest.fn() };
let mockParams: { focus?: string } = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

const TODAY = "2026-10-29";

function tap(id: string): Notification {
  return {
    id,
    childId: "student-0001",
    childName: "Katrina Reyes",
    kind: "time_in",
    at: `${TODAY}T08:55:00.000+08:00`,
    read: false,
  };
}

const withRow = groupFeed([tap("other"), tap("pushed")], TODAY);

type Props = {
  sections: FeedSection[];
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};

const fetching: Props = {
  sections: [],
  isFetching: true,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
};

async function renderFocus(initial: Props) {
  const rendered = await renderHook(
    ({ sections, ...feed }: Props) => useFocusRow(sections, feed),
    { initialProps: initial },
  );
  const scrollToLocation = jest.fn();
  const scrollTo = jest.fn();
  rendered.result.current.listRef.current = {
    scrollToLocation,
    getScrollResponder: () => ({ scrollTo }),
  } as never;
  return { ...rendered, scrollToLocation, scrollTo };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { focus: "pushed" };
});

test("scrolls to the row, centred, then lets go of it", async () => {
  const { rerender, scrollToLocation } = await renderFocus(fetching);

  await rerender({ ...fetching, sections: withRow, isFetching: false });

  // The header is item 0 to a SectionList, so the second row is item 2.
  expect(scrollToLocation).toHaveBeenCalledWith({
    sectionIndex: 0,
    itemIndex: 2,
    viewPosition: 0.5,
  });
  expect(mockRouter.setParams).toHaveBeenCalledWith({ focus: undefined });
});

test("waits while the feed is still being fetched", async () => {
  const { rerender } = await renderFocus(fetching);

  await rerender({ ...fetching, dataUpdatedAt: Date.now() + 1 });

  expect(mockRouter.setParams).not.toHaveBeenCalled();
});

test("doesn't give up on a feed fetched before the tap", async () => {
  const { rerender } = await renderFocus(fetching);

  await rerender({ ...fetching, isFetching: false, dataUpdatedAt: 1 });

  expect(mockRouter.setParams).not.toHaveBeenCalled();
});

test("lets go once a fetch after the tap ends without the row", async () => {
  const { rerender, scrollToLocation } = await renderFocus(fetching);

  await rerender({
    ...fetching,
    isFetching: false,
    dataUpdatedAt: Date.now() + 1,
  });

  expect(scrollToLocation).not.toHaveBeenCalled();
  expect(mockRouter.setParams).toHaveBeenCalledWith({ focus: undefined });
});

test("lets go when that fetch failed, too", async () => {
  const { rerender } = await renderFocus(fetching);

  await rerender({
    ...fetching,
    isFetching: false,
    errorUpdatedAt: Date.now() + 1,
  });

  expect(mockRouter.setParams).toHaveBeenCalledWith({ focus: undefined });
});

test("does nothing without a push", async () => {
  mockParams = {};
  const { rerender, scrollToLocation } = await renderFocus(fetching);

  await rerender({ ...fetching, sections: withRow, isFetching: false });

  expect(scrollToLocation).not.toHaveBeenCalled();
  expect(mockRouter.setParams).not.toHaveBeenCalled();
});

test("a row not drawn yet: jump near it, try once more, then leave it", async () => {
  jest.useFakeTimers();
  const { result, rerender, scrollToLocation, scrollTo } =
    await renderFocus(fetching);
  await rerender({ ...fetching, sections: withRow, isFetching: false });
  const failed = { index: 12, averageItemLength: 70, highestMeasuredFrameIndex: 4 };

  await act(async () => {
    result.current.onScrollToIndexFailed(failed);
    jest.runAllTimers();
  });
  await act(async () => {
    result.current.onScrollToIndexFailed(failed);
    jest.runAllTimers();
  });

  expect(scrollTo).toHaveBeenCalledTimes(1);
  expect(scrollTo).toHaveBeenCalledWith({ y: 840, animated: false });
  expect(scrollToLocation).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});
