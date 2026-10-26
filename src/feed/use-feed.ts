/**
 * The notification feed, the unread badge, and marking things read.
 *
 * Three queries that look related and must be kept apart. The feed holds every
 * page a parent has scrolled through; the badge is one number needed on every
 * screen. Sharing a key between them would keep the whole page list alive and
 * refetching for the sake of a number — which, with focus tracking on, means a
 * burst of requests each time the app returns to the foreground.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getFeedPage,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/endpoints";
import type { FeedPage } from "@/api/schemas";

export const FEED_KEY = ["notifications", "feed"] as const;
export const UNREAD_KEY = ["notifications", "unread"] as const;

/**
 * Matching `useMe`. Without it the query client's default of zero would make
 * every return to the foreground refetch **every page already loaded**, one
 * after another.
 */
const FEED_STALE_MS = 30_000;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: FEED_KEY,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getFeedPage(pageParam),
    initialPageParam: undefined as string | undefined,
    // `nextBefore` is the server's own cursor, handed straight back.
    // Returning undefined is what tells Query there are no more pages.
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextBefore ?? undefined,
    staleTime: FEED_STALE_MS,
    // The feed does NOT refetch when the app returns to the foreground. An
    // infinite query refetches every page already loaded, one after another,
    // so a parent who had scrolled a long way would pay for all of it on
    // mobile data each time they opened the app. The badge and `/me` already
    // keep the token alive and say when something new arrived, and pulling
    // down is the explicit way to ask for more.
    //
    // `maxPages` was tried here and removed: without a `getPreviousPageParam`
    // it drops the oldest pages as new ones load, so rows vanish from under
    // the parent's thumb and can never come back.
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * The number on the badge.
 *
 * It stops at 10 on the server, so 10 means "10 or more" and the app can never
 * work the true number out by subtracting. That is why marking something read
 * re-asks this rather than doing arithmetic.
 */
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCount,
    // Without this, signing out starts a loop: `queryClient.clear()` runs
    // while the tabs are still mounted, this refetches with no token, the
    // server answers 401, the 401 path clears again — and round it goes
    // until the layout unmounts.
    enabled,
    staleTime: FEED_STALE_MS,
    retry: false,
  });
}

/**
 * Mark one notification read.
 *
 * The feed itself is updated in place rather than refetched: a read mark only
 * ever travels one way, so there is nothing to roll back, and refetching would
 * pull every loaded page again to change one boolean.
 *
 * The badge *is* re-asked, because the count is capped and cannot be guessed.
 *
 * Read marks are **shared between a child's guardians**: the other parent's
 * count drops too, which is the server's business and another reason not to
 * invent a number here.
 */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData(
        FEED_KEY,
        (old: { pages: FeedPage[]; pageParams: unknown[] } | undefined) =>
          old === undefined
            ? old
            : {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  notifications: page.notifications.map((item) =>
                    item.id === id ? { ...item, read: true } : item,
                  ),
                })),
              },
      );

      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(
        FEED_KEY,
        (old: { pages: FeedPage[]; pageParams: unknown[] } | undefined) =>
          old === undefined
            ? old
            : {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  notifications: page.notifications.map((item) => ({
                    ...item,
                    read: true,
                  })),
                })),
              },
      );

      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}
