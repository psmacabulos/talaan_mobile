/**
 * Home: one card per child, showing today.
 *
 * How `/me` failing is handled matters as much as the layout. Three outcomes,
 * and they must not be blurred together:
 *
 * - it answered — show the cards
 * - it could not be reached — the parent is **still signed in**. No internet
 *   is not a dead token, so they get "Try again" and keep their session
 * - the token was rejected — the API client has already cleared it, and the
 *   gate in `_layout.tsx` moves them to sign-in without this screen doing
 *   anything
 *
 * And a fourth, easy to miss: a refresh that fails when attendance is
 * **already on screen**. Replacing a child's morning with an error message
 * because one pull-to-refresh happened in a tunnel is worse than useless — the
 * cards stay, and the failure is a line above them.
 *
 * A `ScrollView` rather than a `FlatList`: a parent has a handful of children,
 * and the long list in this app is M6's notification feed.
 */
import { useState } from "react";

import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { useMe, useSignOut } from "@/auth/session";
import { useSession } from "@/auth/session-context";
import { ChildCard } from "@/components/child/child-card";
import { Button } from "@/components/form/button";
import { TextLink } from "@/components/form/text-link";
import { Skeleton } from "@/components/skeleton";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hasToken } = useSession();
  const me = useMe(hasToken === true);
  const signOut = useSignOut();

  // `isRefetching` is also true when the app returns to the foreground and
  // re-asks `/me` on its own. Spinning the pull-to-refresh control then would
  // show a parent a spinner they did not ask for, so only a real pull counts.
  const [pulled, setPulled] = useState(false);

  // Branch on the data, never on `me.isPending`. A **disabled** query reports
  // pending for ever, so the moment signing out flips `hasToken` to false this
  // screen would freeze with no way out (docs/PROBLEMS-LOG.md, P-009).
  const answer = me.data;
  const failureMessage =
    me.error instanceof ApiError ? me.error.message : strings.errors.unexpected;

  const onPull = () => {
    setPulled(true);
    void me.refetch().finally(() => setPulled(false));
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.base,
          padding: theme.space.base,
        }}
        refreshControl={
          <RefreshControl
            refreshing={pulled && me.isRefetching}
            onRefresh={onPull}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text
          accessibilityRole="header"
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.lg,
            paddingHorizontal: theme.space.sm,
          }}
        >
          {strings.home.yourChildren}
        </Text>

        {me.isError && answer !== undefined ? (
          <FailureBanner message={failureMessage} onRetry={() => me.refetch()} />
        ) : null}

        {answer === undefined ? (
          me.isError ? (
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
                {failureMessage}
              </Text>
              <TextLink
                label={strings.errors.tryAgain}
                onPress={() => me.refetch()}
              />
            </View>
          ) : (
            <LoadingCards />
          )
        ) : answer.children.length === 0 ? (
          <View style={{ gap: theme.space.xs, padding: theme.space.base }}>
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.base,
              }}
            >
              {strings.home.noChildren}
            </Text>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.sm,
              }}
            >
              {strings.home.noChildrenHint}
            </Text>
          </View>
        ) : (
          answer.children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))
        )}

        <View
          style={{
            gap: theme.space.md,
            marginTop: "auto",
            paddingTop: theme.space.base,
          }}
        >
          <Button
            label={strings.home.addChild}
            onPress={() => router.push("/link-child")}
          />
          <View style={{ alignItems: "center" }}>
            <TextLink
              label={strings.session.signOut}
              onPress={() => signOut.mutate()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * A refresh failed, but yesterday's — or this morning's — answer is still on
 * screen. Say so above it without taking it away.
 */
function FailureBanner({
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
        backgroundColor: theme.status.absent.background,
        borderRadius: theme.radius.base,
        gap: theme.space.xs,
        padding: theme.space.md,
      }}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: theme.status.absent.text,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {message}
      </Text>
      <TextLink label={strings.errors.tryAgain} onPress={onRetry} />
    </View>
  );
}

/**
 * Card-shaped placeholders while the first answer is on its way.
 *
 * Two, not one: a parent with several children sees roughly the shape of what
 * is coming, and the screen does not jump as much when it arrives.
 */
function LoadingCards() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.base }}>
      {[0, 1].map((key) => (
        <View
          key={key}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            flexDirection: "row",
            gap: theme.space.base,
            padding: theme.space.base,
          }}
        >
          <Skeleton width={80} height={100} radius={theme.radius.base} />
          <View style={{ flex: 1, gap: theme.space.sm }}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="50%" height={14} />
            <Skeleton width="85%" height={14} />
            <Skeleton width={96} height={28} radius={theme.radius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}
