/**
 * Where a signed-in parent lands.
 *
 * Still deliberately plain. M4 needs a linked child to be **visible** — that
 * is its "done when" — so this lists them by name, school and class. **M5
 * replaces each row with the real card**: the photo, the status pill and the
 * times they tapped in and out.
 *
 * How `/me` failing is handled matters more than the layout. Three outcomes,
 * and they must not be blurred together:
 *
 * - it answered — show the children
 * - it could not be reached — the parent is **still signed in**. No internet
 *   is not a dead token, so they get "Try again" and keep their session
 * - the token was rejected — the API client has already cleared it, and the
 *   gate in `_layout.tsx` moves them to sign-in without this screen doing
 *   anything
 */
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import type { ChildToday } from "@/api/schemas";
import { useMe, useSignOut } from "@/auth/session";
import { useSession } from "@/auth/session-context";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/form/button";
import { TextLink } from "@/components/form/text-link";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function SignedInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hasToken } = useSession();
  const me = useMe(hasToken === true);
  const signOut = useSignOut();

  // Branch on the data, never on `me.isPending`. A **disabled** query reports
  // pending for ever, so the moment signing out flips `hasToken` to false this
  // screen would freeze on "Checking your sign-in…" with no way out
  // (docs/PROBLEMS-LOG.md, P-009).
  const answer = me.data;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.xl,
          padding: theme.space.xl,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Logo size={48} />
        </View>

        {me.isError ? (
          <View style={{ alignItems: "center", gap: theme.space.base }}>
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: theme.colors.destructive,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.base,
                textAlign: "center",
              }}
            >
              {me.error instanceof ApiError
                ? me.error.message
                : strings.errors.unexpected}
            </Text>
            <TextLink
              label={strings.errors.tryAgain}
              onPress={() => me.refetch()}
            />
          </View>
        ) : answer ? (
          <View style={{ gap: theme.space.base }}>
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fontFamily.headingBold,
                fontSize: theme.fontSize.lg,
              }}
            >
              {strings.home.yourChildren}
            </Text>

            {answer.children.length === 0 ? (
              <View style={{ gap: theme.space.xs }}>
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
                <ChildRow key={child.id} child={child} />
              ))
            )}
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: theme.space.base }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.sm,
              }}
            >
              {strings.session.checking}
            </Text>
          </View>
        )}

        <View style={{ gap: theme.space.md, marginTop: "auto" }}>
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

/** One linked child. M5 turns this into the card with the photo and status. */
function ChildRow({ child }: { child: ChildToday }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        gap: theme.space.xs,
        padding: theme.space.base,
      }}
    >
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.base,
        }}
      >
        {child.firstName} {child.lastName}
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {strings.child.gradeAndSection(child.gradeLevel, child.section)}
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
        }}
      >
        {child.school.name}
      </Text>
    </View>
  );
}
