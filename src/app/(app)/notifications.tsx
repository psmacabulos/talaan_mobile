/**
 * The feed: every tap, newest first, across all a parent's children.
 *
 * This is the one genuinely long list in the app, so it is a `FlatList` with
 * paging rather than a `ScrollView`. The cursor comes from the server and goes
 * straight back: `nextBefore` is opaque, and a cursor the app invented is a
 * `400`, never a quiet first page.
 *
 * Tapping a row marks it read and opens that child's day. Read marks are
 * shared by a child's guardians, so the other parent's badge drops too — which
 * is the server's business, not something the app works out.
 */
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import type { Notification } from "@/api/schemas";
import { useFeed, useMarkAllRead, useMarkRead } from "@/feed/use-feed";
import { TextLink } from "@/components/form/text-link";
import { Skeleton } from "@/components/skeleton";
import {
  formatSchoolDate,
  formatSchoolTime,
  schoolDateOf,
} from "@/lib/school-time";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function NotificationsScreen() {
  const theme = useTheme();
  const feed = useFeed();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = feed.data?.pages.flatMap((page) => page.notifications) ?? [];
  const hasAny = items.length > 0;

  const loadMore = () => {
    // Both halves matter: `hasNextPage` stops an endless tail, and
    // `isFetchingNextPage` stops `onEndReached` — which fires more than once
    // as a list settles — from asking twice.
    if (!feed.hasNextPage || feed.isFetchingNextPage) {
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

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedRow item={item} onRead={(id) => markRead.mutate(id)} />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.sm,
          padding: theme.space.base,
        }}
        refreshing={feed.isRefetching && !feed.isFetchingNextPage}
        onRefresh={() => void feed.refetch()}
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
          feed.isFetchingNextPage ? (
            <View style={{ padding: theme.space.base }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

/**
 * One line: "Juan Cruz tapped in at 7:56 AM", with a dot while it is unread.
 *
 * The time is on the school's clock, so a parent abroad reads the moment their
 * child walked through the gate.
 */
function FeedRow({
  item,
  onRead,
}: {
  item: Notification;
  onRead: (id: string) => void;
}) {
  const theme = useTheme();
  const router = useRouter();

  const time = formatSchoolTime(item.at);

  // A feed row only says the time. That reads fine for this morning and badly
  // for last Tuesday, so anything not from today names its day as well — on
  // the school's calendar, which is the one the tap was recorded against.
  const today = schoolDateOf(new Date().toISOString());
  const day =
    schoolDateOf(item.at) === today ? undefined : formatSchoolDate(item.at);
  const line =
    item.kind === "time_in"
      ? strings.feed.tappedIn(item.childName, time ?? strings.card.noTime)
      : strings.feed.tappedOut(item.childName, time ?? strings.card.noTime);

  // An unread row earns three differences, not one: a dot, heavier text and a
  // tinted background. Colour never carries meaning alone (docs/DESIGN.md,
  // rule 3), and a lone dot is easy to miss on a crowded screen.
  const unread = !item.read;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        item.read ? undefined : strings.feed.unreadLabel,
        line,
        day,
      ]
        .filter(Boolean)
        .join(". ")}
      onPress={() => {
        if (!item.read) {
          onRead(item.id);
        }

        router.push(`/child/${item.childId}`);
      }}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: unread ? theme.colors.muted : theme.colors.card,
        borderColor: unread ? theme.colors.primary : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: theme.space.md,
        minHeight: theme.minTouchTarget,
        opacity: pressed ? 0.85 : 1,
        padding: theme.space.base,
      })}
    >
      <View
        style={{
          backgroundColor: unread ? theme.colors.primary : "transparent",
          borderRadius: theme.radius.sm,
          height: 10,
          width: 10,
        }}
      />

      <Text
        style={{
          color: theme.colors.foreground,
          flex: 1,
          // Unread is heavier as well as dotted: colour never alone.
          fontFamily: unread
            ? theme.fontFamily.bodyBold
            : theme.fontFamily.body,
          fontSize: theme.fontSize.base,
        }}
      >
        {line}
      </Text>

      {day === undefined ? null : (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.xs,
          }}
        >
          {day}
        </Text>
      )}
    </Pressable>
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
      style={{ alignItems: "center", gap: theme.space.base, padding: theme.space.xl }}
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

function LoadingRows() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      {[0, 1, 2, 3].map((key) => (
        <Skeleton key={key} height={64} radius={theme.radius.md} />
      ))}
    </View>
  );
}
