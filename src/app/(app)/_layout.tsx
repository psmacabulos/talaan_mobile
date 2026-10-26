/**
 * The signed-in half: a stack, with the tab bar as its first screen.
 *
 * The two tabs — Home and Notifications — are the places a parent lives.
 * Linking a child and a child's day are **pushed over** them, so the tab bar
 * stays put underneath and Android's back button returns to where they were.
 *
 * This shape exists because of a real bug (docs/PROBLEMS-LOG.md, P-011). When
 * the tabs were introduced in M6, `link-child` and `child/[id]` became tab
 * screens hidden with `href: null` — and a screen taken out of the tab bar
 * cannot be navigated to. Tapping "Link a child" flickered and did nothing.
 *
 * A detail screen is not a tab. It belongs on a stack above them.
 */
import { Stack } from "expo-router";

import { useTheme } from "@/theme";

export default function SignedInLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
