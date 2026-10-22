/**
 * The main button on a form.
 *
 * Disabled while a request is in flight, so a parent on a slow connection
 * can't create two accounts by tapping twice — and it says what it is doing
 * rather than just going grey (CLAUDE.md, "UX quality bar").
 *
 * It keeps the 48-point minimum height even when the label wraps at large
 * font sizes.
 */
import { Pressable, Text } from "react-native";

import { useTheme } from "@/theme";

type ButtonProps = {
  label: string;
  /** Shown instead of `label` while `busy`. */
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function Button({
  label,
  busyLabel,
  busy = false,
  disabled = false,
  onPress,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = busy || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        justifyContent: "center",
        minHeight: theme.minTouchTarget,
        opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
        paddingHorizontal: theme.space.base,
        paddingVertical: theme.space.sm,
      })}
    >
      <Text
        style={{
          color: theme.colors.primaryForeground,
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.base,
          textAlign: "center",
        }}
      >
        {busy && busyLabel ? busyLabel : label}
      </Text>
    </Pressable>
  );
}
