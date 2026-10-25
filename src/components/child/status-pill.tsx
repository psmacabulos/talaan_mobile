/**
 * A child's status today: "Present", "Late", "Came in".
 *
 * The colour and the word always travel together. Status colours mean one
 * thing everywhere and are never themed (docs/DESIGN.md, rule 2), and colour
 * never carries the meaning alone (rule 3) — which matters for the roughly
 * one father in twelve who cannot tell the green from the amber.
 */
import { Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { StatusLabel } from "@/children/status-words";

export function StatusPill({ label }: { label: StatusLabel }) {
  const theme = useTheme();
  const tone = theme.status[label.tone];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: tone.background,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.xs,
      }}
    >
      <Text
        style={{
          color: tone.text,
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.sm,
        }}
      >
        {label.word}
      </Text>
    </View>
  );
}
