/**
 * The feed: every tap, and every "another parent linked your child" notice,
 * newest first, across all a parent's children, in sections: Today,
 * Yesterday, Earlier this week, Earlier this month, then one per month
 * (`src/feed/feed-groups.ts`).
 *
 * This is the one genuinely long list in the app, so it is a `SectionList`
 * with paging rather than a `ScrollView`. Sections are worked out from the
 * pages loaded so far: a new page only adds rows to the last section or
 * starts older ones. The cursor comes from the server and goes
 * straight back: `nextBefore` is opaque, and a cursor the app invented is a
 * `400`, never a quiet first page.
 *
 * Tapping a row marks it read; a tap's row also opens that child's day
 * (`src/components/feed/feed-row.tsx`). Read marks for taps are shared by a
 * child's guardians, so the other parent's badge drops too — which is the
 * server's business, not something the app works out.
 *
 * A tapped push opens this tab at its row (`src/feed/use-focus-row.ts`).
 */
import { useMemo } from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { useFeed, useMarkAllRead, useMarkRead } from "@/feed/use-feed";
import { FeedRow } from "@/components/feed/feed-row";
import { FeedSectionHeader } from "@/components/feed/feed-section-header";
import { TextLink } from "@/components/form/text-link";
import { Skeleton } from "@/components/skeleton";
import { groupFeed } from "@/feed/feed-groups";
import { useFocusRow } from "@/feed/use-focus-row";
import { useSchoolToday } from "@/lib/use-school-today";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function NotificationsScreen() {
  const theme = useTheme();
  const feed = useFeed();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const { today, refresh: refreshToday } = useSchoolToday();

  const pages = feed.data?.pages;
  const sections = useMemo(
    () => groupFeed(pages?.flatMap((page) => page.notifications) ?? [], today),
    [pages, today],
  );
  const hasAny = sections.length > 0;
  const { listRef, onScrollToIndexFailed } = useFocusRow(sections, feed);

  const loadMore = () => {
    // All three matter: `hasNextPage` stops an endless tail, and
    // `isFetchingNextPage` stops `onEndReached` — which fires more than once
    // as a list settles — from asking twice. After a failure only Try again
    // asks: the footer swapping between spinner and error changes the list's
    // length, which fires `onEndReached` again, and offline that would loop.
    if (
      !feed.hasNextPage ||
      feed.isFetchingNextPage ||
      feed.isFetchNextPageError
    ) {
      return;
    }

    void feed.fetchNextPage();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: theme.space.base,
          paddingVertical: theme.space.md,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.lg,
          }}
        >
          {strings.feed.title}
        </Text>

        {hasAny ? (
          <TextLink
            label={
              markAllRead.isPending
                ? strings.feed.markingAllRead
                : strings.feed.markAllRead
            }
            onPress={() => markAllRead.mutate()}
          />
        ) : null}
      </View>

      <SectionList
        ref={listRef}
        testID="feed-list"
        sections={sections}
        onScrollToIndexFailed={onScrollToIndexFailed}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => (
          <FeedRow
            item={item}
            bucket={section.bucket}
            onRead={markRead.mutate}
          />
        )}
        renderSectionHeader={({ section }) => (
          <FeedSectionHeader title={section.title} />
        )}
        // Off by default on Android. On, a parent deep in last month can
        // still see which month they are in.
        stickySectionHeadersEnabled
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.sm,
          paddingBottom: theme.space.base,
          paddingHorizontal: theme.space.base,
        }}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => {
          refreshToday();
          void feed.refetch();
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          feed.isError ? (
            <FeedFailure
              message={
                feed.error instanceof ApiError
                  ? feed.error.message
                  : strings.errors.unexpected
              }
              onRetry={() => void feed.refetch()}
            />
          ) : feed.data === undefined ? (
            <LoadingRows />
          ) : (
            <Empty />
          )
        }
        ListFooterComponent={
          !hasAny ? undefined : feed.isFetchingNextPage ? (
            <View style={{ padding: theme.space.base }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : feed.isFetchNextPageError ? (
            // The rows already shown stay; only the older ones failed.
            <FeedFailure
              message={strings.feed.olderFailed}
              onRetry={() => void feed.fetchNextPage()}
            />
          ) : !feed.hasNextPage ? (
            <EndOfFeed />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

function Empty() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs, padding: theme.space.base }}>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.base,
        }}
      >
        {strings.feed.empty}
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {strings.feed.emptyHint}
      </Text>
    </View>
  );
}

function FeedFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: "center",
        gap: theme.space.base,
        padding: theme.space.xl,
      }}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: theme.colors.destructive,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.base,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
      <TextLink label={strings.errors.tryAgain} onPress={onRetry} />
    </View>
  );
}

/** Said once the last page is in, so the end of the list isn't a mystery. */
function EndOfFeed() {
  const theme = useTheme();

  return (
    <Text
      style={{
        color: theme.colors.mutedForeground,
        fontFamily: theme.fontFamily.body,
        fontSize: theme.fontSize.sm,
        padding: theme.space.base,
        textAlign: "center",
      }}
    >
      {strings.feed.endOfFeed}
    </Text>
  );
}

function LoadingRows() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm, paddingTop: theme.space.md }}>
      <Skeleton height={16} width={80} radius={theme.radius.sm} />
      {[0, 1, 2, 3].map((key) => (
        <Skeleton key={key} height={64} radius={theme.radius.md} />
      ))}
    </View>
  );
}
