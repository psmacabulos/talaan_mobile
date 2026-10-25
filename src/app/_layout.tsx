/**
 * The app's shell: fonts, the query cache, the session, and the one thing that
 * decides whether a parent is looking at sign-in or at their children.
 *
 * It holds the splash screen until the fonts are ready, so no parent ever
 * sees the text reflow from the system font to ours. The splash is hidden
 * whether the fonts loaded or failed: a font that can't load is a
 * worse-looking app; a splash that never goes away is a broken one.
 */
import { useEffect } from "react";

import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import {
  Lexend_400Regular,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { clearPhotoCache } from "@/api/photo-cache";
import { onSignedOut } from "@/api/session";
import { startFocusTracking } from "@/auth/focus";
import { SessionProvider, useSession } from "@/auth/session-context";
import { useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

/**
 * The only thing in the app that moves a parent between signed-out and
 * signed-in.
 *
 * Signing in, signing up and signing out change one piece of state — whether
 * a token exists — and this reacts. Nothing else navigates on their behalf,
 * so there is never a second mover to race: an `unauthorized` answer clears
 * the token deep in the API client, and the parent arrives at sign-in because
 * of this effect, not because the client knew where to send them.
 */
function useSignedInGate() {
  const { hasToken } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Undefined means secure storage has not been read yet. Moving anyone now
    // would be a guess.
    if (hasToken === undefined) {
      return;
    }

    // A route group adds no path segment, so "/" belongs to neither group.
    // A parent waiting there must be moved either way, which is why this asks
    // "are they where they belong?" rather than "are they in the wrong half?"
    const inAuthScreens = segments[0] === "(auth)";
    const inAppScreens = segments[0] === "(app)";

    if (!hasToken && !inAuthScreens) {
      router.replace("/sign-in");
    } else if (hasToken && !inAppScreens) {
      router.replace("/home");
    }
  }, [hasToken, segments, router]);
}

function AppShell() {
  const theme = useTheme();
  const client = useQueryClient();
  const { setHasToken } = useSession();

  useSignedInGate();

  // Tells the query cache when the app returns to the foreground, which is
  // what keeps the 30-day token alive (src/auth/focus.ts).
  useEffect(() => startFocusTracking(), []);

  // The API client clears the token the moment the server says `unauthorized`
  // (src/api/session.ts). All that is left is to drop everything fetched with
  // it, which CLAUDE.md requires of any 401, and to say so. This never
  // navigates: the gate above watches `hasToken` and does that alone.
  useEffect(() => {
    onSignedOut(() => {
      client.clear();
      // A token that expired or was revoked ends the session just as surely as
      // pressing Sign out, and CLAUDE.md requires any 401 to clear the photos
      // too. Nothing visible happens at this moment, which is exactly why it
      // is easy to leave children's faces behind.
      void clearPhotoCache();
      setHasToken(false);
    });

    return () => onSignedOut(null);
  }, [client, setHasToken]);

  return (
    <>
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  // The keys become the font family names used in src/theme/typography.ts.
  const [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
    Lexend_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </QueryClientProvider>
  );
}
