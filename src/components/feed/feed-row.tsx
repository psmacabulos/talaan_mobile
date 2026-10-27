/**
 * One row of the feed, with a dot while it is unread.
 *
 * A tap reads "Juan Cruz tapped in", with its time on the right, and opens
 * that child's day. A `guardian_linked` notice reads "An account named Ana
 * Santos linked to Juan Cruz.", with the advice under it; pressing
 * it marks it read and stays here, since it isn't about a tap. Once read it
 * does nothing when pressed, so it stops being announced as a button. It
 * stays the same `Pressable` throughout: swapping it for a `View` would
 * rebuild the row under TalkBack's focus, which can throw focus to the top.
 *
 * Times are on the school's clock, so a parent abroad reads the moment it
 * happened in Balanga. How the time is written depends on the section the
 * row sits in (`src/feed/feed-words.ts`).
 *
 * Memoised: a long feed re-renders every row whenever a page arrives, and
 * only the rows whose item changed need to.
 *
 * It lives outside `src/app` so it can have tests: every file there becomes a
 * route (docs/PROBLEMS-LOG.md, P-004).
 */
import { useRouter } from "expo-router";
import { memo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import type { Notification } from "@/api/schemas";
import { PersonPlusIcon } from "@/components/icons/feed-icons";
import type { FeedBucket } from "@/feed/feed-groups";
import { feedWords } from "@/feed/feed-words";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export const FeedRow = memo(function FeedRow({
  item,
  bucket,
  onRead,
}: {
  item: Notification;
  /** The section the row sits in. */
  bucket: FeedBucket;
  /** Stable across renders (the mutation's `mutate`), or memo is wasted. */
  onRead: (id: string) => void;
}) {
  const theme = useTheme();
  const router = useRouter();

  const words = feedWords(item, bucket);

  // An unread row earns three differences, not one: a dot, heavier text and a
  // tinted background. Colour never carries meaning alone (docs/DESIGN.md,
  // rule 3), and a lone dot is easy to miss on a crowded screen.
  const unread = !item.read;
  // A read notice has nowhere to go and nothing left to mark.
  const pressable = words.opensChildDay || unread;

  const label = unread
    ? `${strings.feed.unreadLabel}. ${words.spoken}`
    : words.spoken;

  const style: ViewStyle = {
    alignItems: "center",
    backgroundColor: unread ? theme.colors.muted : theme.colors.card,
    borderColor: unread ? theme.colors.primary : theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.space.md,
    minHeight: theme.minTouchTarget,
    padding: theme.space.base,
  };

  const content = (
    <>
      <View
        style={{
          backgroundColor: unread ? theme.colors.primary : "transparent",
          borderRadius: theme.radius.sm,
          height: 10,
          width: 10,
        }}
      />

      {item.kind === "guardian_linked" ? (
        <PersonPlusIcon color={theme.colors.primary} />
      ) : null}

      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text
          style={{
            color: theme.colors.foreground,
            // Unread is heavier as well as dotted: colour never alone.
            fontFamily: unread
              ? theme.fontFamily.bodyBold
              : theme.fontFamily.body,
            fontSize: theme.fontSize.base,
          }}
        >
          {words.text}
        </Text>

        {words.detail === undefined ? null : (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
            }}
          >
            {words.detail}
          </Text>
        )}
      </View>

      <Text
        style={{
          color: theme.colors.mutedForeground,
          // Never squeezed: the sentence wraps instead of the time.
          flexShrink: 0,
          // Lexend for every number and time (docs/DESIGN.md).
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.sm,
        }}
      >
        {words.when}
      </Text>
    </>
  );

  return (
    <Pressable
      accessible
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityLabel={label}
      accessibilityHint={
        !pressable
          ? undefined
          : words.opensChildDay
            ? strings.feed.opensChildDay(item.childName)
            : strings.feed.marksAsRead
      }
      onPress={
        pressable
          ? () => {
              if (unread) {
                onRead(item.id);
              }

              if (words.opensChildDay) {
                router.push(`/child/${item.childId}`);
              }
            }
          : undefined
      }
      style={({ pressed }) => ({
        ...style,
        opacity: pressed && pressable ? 0.85 : 1,
      })}
    >
      {content}
    </Pressable>
  );
});
