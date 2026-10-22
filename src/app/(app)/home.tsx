/**
 * Where a signed-in parent lands.
 *
 * Deliberately almost empty: M3's job is that signing in, signing out and
 * coming back tomorrow all work. **M5 replaces this with Home**, the card per
 * child showing today's attendance.
 *
 * What is worth keeping is how `/me` failing is handled. Three outcomes, and
 * they must not be blurred together:
 *
 * - it answered — show the parent's name
 * - it could not be reached — the parent is **still signed in**. No internet
 *   is not a dead token, so they get "Try again" and keep their session
 * - the token was rejected — the API client has already cleared it, and the
 *   gate in `_layout.tsx` moves them to sign-in without this screen doing
 *   anything
 */
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/api/errors";
import { useMe, useSignOut } from "@/auth/session";
import { useSession } from "@/auth/session-context";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/form/button";
import { TextLink } from "@/components/form/text-link";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function SignedInScreen() {
  const theme = useTheme();
  const { hasToken } = useSession();
  const me = useMe(hasToken === true);
  const signOut = useSignOut();

  // Branch on the data, never on `me.isPending`. A **disabled** query reports
  // pending for ever, so the moment signing out flips `hasToken` to false this
  // screen would freeze on "Checking your sign-in…" with no way out
  // (docs/PROBLEMS-LOG.md, P-009).
  const parent = me.data;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: theme.space.xl,
          justifyContent: "center",
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
        ) : parent ? (
          <View style={{ alignItems: "center", gap: theme.space.xs }}>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fontFamily.body,
                fontSize: theme.fontSize.base,
              }}
            >
              {strings.session.greeting}
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fontFamily.headingBold,
                fontSize: theme.fontSize.lg,
                textAlign: "center",
              }}
            >
              {parent.firstName} {parent.lastName}
            </Text>
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

        <Button
          label={strings.session.signOut}
          busyLabel={strings.session.signingOut}
          busy={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
