# Step M7b — A push with the app open, and a tap opens the feed

A reproducible checklist, written from the real diff. The story of how it was
built, and the errors hit, is in `docs/BUILD-LOG.md`, "M7b".

**What you end with:** a push that arrives with the app open shows as
Android's usual banner, and Home, the badge, the feed and that child's day
reload. Tapping any push (app open, in the background or closed) marks it
read and opens Notifications scrolled to it. A link notice opens the feed
too, never a child's day.

```
push arrives, app open ─► showPushesWhileOpen(): banner + sound
                       └► onPushReceived ─► refetch /me, unread, feed, child

push tapped ─► onPushTapped (listener, or the launch response; once per id)
            └► use-push-events: dismissAll? ─► navigate /notifications?focus=id
                                ─► POST /notifications/:id/read ─► refetch all
                                         │
notifications.tsx ─► use-focus-row: row loaded? scroll to it (itemIndex + 1)
                                    not after a fetch? stay at the top
                                    either way: setParams({ focus: undefined })
```

No new package and no new development build: everything is JavaScript on
native code already in the build.

## 1. `src/push/notifications.ts`

Still the only file that imports `expo-notifications`. Add `import { z } from
"zod";` and, before `STOP_PUSH_TIMEOUT_MS`:

```ts
/**
 * What every push carries besides its words (docs/TALAAN-API.md:225), a tap
 * and a link notice alike. Checked like any answer from the server: a push
 * whose data can't be read still opens the feed, just not at a row.
 */
const pushDataSchema = z.object({
  notificationId: z.string(),
  childId: z.string(),
});

export type PushData = z.infer<typeof pushDataSchema>;

function pushDataOf(notification: Notifications.Notification): PushData | null {
  const parsed = pushDataSchema.safeParse(notification.request.content.data);
  return parsed.success ? parsed.data : null;
}

/**
 * Show a push that arrives while the app is open, the same way Android shows
 * one when it's closed: a banner, in the list, with sound. Without this,
 * Expo shows nothing while the app is in front. Called once, at start.
 *
 * The sound matters on Android: without it the banner doesn't drop down.
 */
export function showPushesWhileOpen(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Calls `onReceive` for each push that arrives while the app is open. */
export function onPushReceived(
  onReceive: (data: PushData | null) => void,
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => onReceive(pushDataOf(notification)),
  );
  return () => subscription.remove();
}

/**
 * The last tap handed on, by the push's own id. Module state, so a screen
 * that mounts again (signing out and back in) can't hand on the same tap.
 */
let lastTapId: string | null = null;

/**
 * Calls `onTap` when the parent taps a push: one that opened the app from
 * closed (handed on at once, if not handed on before), and each one after.
 *
 * Expo can report the tap that opened the app both ways, and keeps it as the
 * "last response" until told to forget it, so every tap is forgotten once
 * read and skipped if it was already handed on.
 */
export function onPushTapped(
  onTap: (data: PushData | null) => void,
): () => void {
  const handle = (response: Notifications.NotificationResponse) => {
    Notifications.clearLastNotificationResponse();

    const id = response.notification.request.identifier;
    if (id === lastTapId) {
      return;
    }
    lastTapId = id;
    onTap(pushDataOf(response.notification));
  };

  const subscription =
    Notifications.addNotificationResponseReceivedListener(handle);

  try {
    const launch = Notifications.getLastNotificationResponse();
    if (launch !== null) {
      handle(launch);
    }
  } catch {
    // A phone that can't do push has no tap to hand on.
  }

  return () => subscription.remove();
}
```

Why: the push's `data` comes from the server, so it's checked like any answer.
Expo keeps a tap as the "last response" until cleared, and can report a cold
start's tap twice, hence the clear and the id.

## 2. `src/push/use-push-events.ts` (new)

```ts
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
```

## 3. Mount it, and show pushes while open

`src/app/(app)/_layout.tsx`, inside `SignedInLayout`, after `useTheme()`:

```ts
// A push arriving refreshes the screens; tapping one opens the feed at it.
usePushEvents();
```

`src/app/_layout.tsx`, after `SplashScreen.preventAutoHideAsync()`:

```ts
// Before any push can arrive: without it, one sent while the app is open
// doesn't show at all.
showPushesWhileOpen();
```

Why the signed-in layout: there it runs only after the sign-in gate has moved
the parent from "/" to Home, so a cold start can't race the gate.

## 4. A key for everything about one child

`src/children/use-children.ts`:

```ts
/** Everything cached about one child, whatever the day. */
export const CHILD_KEY = (childId: string) => ["child", childId] as const;

export const CHILD_DAY_KEY = (childId: string, date?: string) =>
  [...CHILD_KEY(childId), "day", date ?? "today"] as const;
```

## 5. Finding and scrolling to the row

At the end of `src/feed/feed-groups.ts`:

```ts
/** Where a notification sits in the sections, or `null` if it isn't there. */
export function locateInSections(
  sections: FeedSection[],
  id: string,
): { sectionIndex: number; itemIndex: number } | null {
  for (const [sectionIndex, section] of sections.entries()) {
    const itemIndex = section.data.findIndex((item) => item.id === id);

    if (itemIndex !== -1) {
      return { sectionIndex, itemIndex };
    }
  }

  return null;
}
```

`src/feed/use-focus-row.ts` (new):

```ts
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
```

In `src/app/(app)/(tabs)/notifications.tsx`: import `useFocusRow`, call
`const { listRef, onScrollToIndexFailed } = useFocusRow(sections, feed);` after
`hasAny`, and give the `SectionList` `ref={listRef}` and
`onScrollToIndexFailed={onScrollToIndexFailed}`.

## 6. Tests

| File | What it holds the code to |
|---|---|
| `src/push/__tests__/notifications.test.ts` | Banner, list and sound, no badge; data passed on, unreadable data as `null`; a tap passed on once, cleared at Expo, not replayed after sign-in; a phone without push doesn't crash |
| `src/push/__tests__/use-push-events.test.tsx` | What's refetched; navigate params; `dismissAll` before `navigate`; read mark before refetch; a failed read mark still opens; a link notice opens the feed |
| `src/feed/__tests__/use-focus-row.test.tsx` | Scroll with `itemIndex + 1`, `viewPosition: 0.5`; `focus` cleared after a fetch since the tap, kept while fetching; jump near, retry once |
| `src/feed/__tests__/feed-groups.test.ts` | `locateInSections` |
| `src/__tests__/notifications-screen.test.tsx` | Its `expo-router` mock gains `useLocalSearchParams` and `setParams` |

A `jest.mock` factory may only use variables named `mock…`: the router stub is
`mockRouter` (`docs/BUILD-LOG.md`, "M7b").

## 7. Check it

```bash
npm run lint
npm run typecheck
npm test
npx expo start --dev-client --clear
```

Then the phone checks in `docs/PLAN.md`, Step M7b.
