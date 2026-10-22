/**
 * Where the app opens.
 *
 * It only says that it is checking. The gate in `_layout.tsx` moves the parent
 * to sign-in or to their children as soon as it knows which, so there is
 * exactly one thing in the app deciding where anyone is.
 *
 * On a cold start with a saved sign-in this is what a parent sees for a
 * moment instead of a flash of the wrong screen.
 */
import { ActivityIndicator, Text, View } from "react-native";

import { strings } from "@/strings";
import { useTheme } from "@/theme";

export default function IndexScreen() {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: theme.colors.background,
        flex: 1,
        gap: theme.space.base,
        justifyContent: "center",
        padding: theme.space.xl,
      }}
    >
      <ActivityIndicator color={theme.colors.primary} />
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.sm,
          textAlign: "center",
        }}
      >
        {strings.session.checking}
      </Text>
    </View>
  );
}
