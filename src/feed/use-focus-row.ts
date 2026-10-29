/**
 * Scroll the feed to the notification a tapped push named (Step M7b).
 *
 * The push opens the feed with `?focus=<notificationId>`
 * (`src/push/use-push-events.ts`). Once the row is in the list, the list
 * scrolls to it, centred so it can't sit under a sticky section header. A row
 * that isn't in the pages already loaded isn't searched for: the feed isn't
 * paged through for it, it just stays at the top.
 *
 * Either way `focus` is cleared, once the row is found or once the first
 * fetch after the tap has finished without it. Left set, a later pull to
 * refresh would jump the list for no reason the parent could see.
 */
import { useEffect, useRef } from "react";
import type { SectionList, ScrollToLocationParamsType } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import type { Notification } from "@/api/schemas";

import { locateInSections, type FeedSection } from "./feed-groups";

/** Long enough for the list to lay out the rows it just measured. */
const RETRY_MS = 100;

/** The parts of the feed's query this needs: when its last fetch ended. */
type FeedFetchState = {
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};

export function useFocusRow(sections: FeedSection[], feed: FeedFetchState) {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const router = useRouter();
  const listRef = useRef<SectionList<Notification, FeedSection>>(null);
  const focusSeen = useRef<{ id: string; at: number } | null>(null);
  const retryScroll = useRef<ScrollToLocationParamsType | null>(null);
  const { isFetching, dataUpdatedAt, errorUpdatedAt } = feed;

  useEffect(() => {
    if (typeof focus !== "string" || focus === "") {
      focusSeen.current = null;
      return;
    }

    if (focusSeen.current?.id !== focus) {
      focusSeen.current = { id: focus, at: Date.now() };
    }

    const at = locateInSections(sections, focus);

    if (at !== null) {
      const params: ScrollToLocationParamsType = {
        sectionIndex: at.sectionIndex,
        // A SectionList counts each section's header as its item 0.
        itemIndex: at.itemIndex + 1,
        viewPosition: 0.5,
      };
      retryScroll.current = params;
      listRef.current?.scrollToLocation(params);
      router.setParams({ focus: undefined });
      return;
    }

    const fetchedSinceTap =
      Math.max(dataUpdatedAt, errorUpdatedAt) >= focusSeen.current.at;

    if (!isFetching && fetchedSinceTap) {
      router.setParams({ focus: undefined });
    }
  }, [focus, sections, isFetching, dataUpdatedAt, errorUpdatedAt, router]);

  /**
   * Rows have no fixed height, so a row the list hasn't drawn yet can't be
   * scrolled to the first time. So: jump to about where it should be, which
   * makes the list draw it, then one more try; after that it stays put.
   */
  const onScrollToIndexFailed = ({
    index,
    averageItemLength,
  }: {
    index: number;
    averageItemLength: number;
  }) => {
    const params = retryScroll.current;
    retryScroll.current = null;

    if (params !== null) {
      listRef.current
        ?.getScrollResponder()
        ?.scrollTo({ y: index * averageItemLength, animated: false });
      setTimeout(() => listRef.current?.scrollToLocation(params), RETRY_MS);
    }
  };

  return { listRef, onScrollToIndexFailed };
}
