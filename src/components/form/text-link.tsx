/**
 * A tappable line of text: "Sign up", "Sign in instead".
 *
 * It looks like a link but behaves like a button, so a screen reader
 * announces it as one. The padding exists to reach the 48-point minimum
 * target (docs/DESIGN.md, rule 5) — text on its own is about half that, and
 * a parent holding a phone one-handed on a tricycle will miss it.
 */
import { Pressable, Text } from "react-native";

import { useTheme } from "@/theme";

type TextLinkProps = {
  label: string;
  onPress: () => void;
};

export function TextLink({ label, onPress }: TextLinkProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        justifyContent: "center",
        minHeight: theme.minTouchTarget,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: theme.space.xs,
      })}
    >
      <Text
        style={{
          color: theme.colors.link,
          fontFamily: theme.fontFamily.bodyBold,
          fontSize: theme.fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
