/**
 * What the app does with a push (docs/PLAN.md, Step M7b):
 *
 * - **One arrives while the app is open:** Android shows it
 *   (`showPushesWhileOpen()`), and Home, the feed, the badge and that child's
 *   day are asked for again, so the screen agrees with the banner.
 * - **The parent taps one,** with the app open, in the background or closed:
 *   it's marked read, since they've seen it, and the feed opens at it. A link
 *   notice opens the feed too, never a child's day: it isn't a tap (P-013).
 *
 * Mounted in the signed-in layout, `src/app/(app)/_layout.tsx`, not the app
 * shell. It then only runs signed in, and only once the sign-in gate has put
 * the parent there, so a cold start from a push can't race the gate's own
 * move to Home.
 */
import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { markNotificationRead } from "@/api/endpoints";
import { ME_KEY } from "@/auth/session";
import { CHILD_KEY } from "@/children/use-children";
import { FEED_KEY, UNREAD_KEY } from "@/feed/use-feed";

import { onPushReceived, onPushTapped, type PushData } from "./notifications";

export function usePushEvents(): void {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const refresh = (data: PushData | null) => {
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      void queryClient.invalidateQueries({ queryKey: FEED_KEY });
      if (data !== null) {
        void queryClient.invalidateQueries({
          queryKey: CHILD_KEY(data.childId),
        });
      }
    };

    const openFeed = async (data: PushData | null) => {
      // A child's day may be open on top of the tabs. Closing it first means
      // Back from the feed goes Home, not to a second set of tabs.
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.navigate({
        pathname: "/notifications",
        params: data === null ? {} : { focus: data.notificationId },
      });

      if (data !== null) {
        try {
          await markNotificationRead(data.notificationId);
        } catch {
          // Still unread: the parent can tap its row. Not worth an error.
        }
      }

      // After the read mark, never before: a feed fetched first would show
      // the row unread again.
      refresh(data);
    };

    const stopReceiving = onPushReceived(refresh);
    const stopTapping = onPushTapped((data) => void openFeed(data));

    return () => {
      stopReceiving();
      stopTapping();
    };
  }, [queryClient, router]);
}
