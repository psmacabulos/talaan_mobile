/**
 * The signed-in half of the app: two tabs.
 *
 * Home and Notifications, because those are the two things the demo needs and
 * both are real screens. The owner's mockup shows five (Attendance, Children,
 * Profile as well); Attendance has no API behind it yet and Profile is after
 * the demo (docs/PLAN.md, "After the demo"), and a tab leading to "coming
 * later" is worse than no tab. Adding them is additive.
 *
 * The badge is why this file exists at all: M6 asks for the unread count "on
 * the feed's tab", and until now there were no tabs.
 */
import { Tabs } from "expo-router";

import { badgeValue } from "@/feed/badge";
import { useSession } from "@/auth/session-context";
import { BellIcon, HomeIcon } from "@/components/icons/tab-icons";
import { useUnreadCount } from "@/feed/use-feed";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function SignedInLayout() {
  const theme = useTheme();
  const { hasToken } = useSession();
  const unread = useUnreadCount(hasToken === true);
  const count = unread.data ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        // React Navigation's own red otherwise, which is not one of ours and
        // would be the only unthemed colour in the app.
        // Smaller than React Navigation's default, which is sized for two
        // digits and looms over a 24-point icon.
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.destructive,
          color: theme.colors.primaryForeground,
          fontSize: 10,
          lineHeight: 14,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 3,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: strings.home.yourChildren,
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: strings.feed.tabLabel,
          tabBarIcon: ({ color }) => <BellIcon color={color} />,
          // The server stops counting at 10, so 10 means "10 or more".
          tabBarBadge: badgeValue(count),
          // A badge is silent to a screen reader without this.
          tabBarAccessibilityLabel: strings.feed.unreadTab(count),
        }}
      />
    </Tabs>
  );
}
