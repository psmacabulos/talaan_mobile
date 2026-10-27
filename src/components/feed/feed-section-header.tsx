/**
 * "Today", "Earlier this week", "September 2026" above a run of feed rows.
 *
 * A heading to TalkBack, so a parent can jump from section to section instead
 * of swiping through every row. The headers stick to the top while their
 * section scrolls, so the background is solid: rows must not show through.
 */
import { Text, View } from "react-native";

import { useTheme } from "@/theme";

export function FeedSectionHeader({ title }: { title: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        paddingBottom: theme.space.xs,
        paddingTop: theme.space.md,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fontFamily.headingBold,
          fontSize: theme.fontSize.sm,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
