/**
 * A child's status today: "Present", "Late", "Came in", with an icon before
 * the word (a tick, a clock, an exclamation mark), as the owner's design has.
 * "Not yet tapped" has no icon: the word is enough, and nothing has happened.
 *
 * The colour and the word always travel together. Status colours mean one
 * thing everywhere and are never themed (docs/DESIGN.md, rule 2), and colour
 * never carries the meaning alone (rule 3) — which matters for the roughly
 * one father in twelve who cannot tell the green from the amber.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/icons/ui-icons";
import { useTheme, type StatusName } from "@/theme";
import type { StatusLabel } from "@/children/status-words";

/** The icon for each tone, in the tone's own text colour. */
function toneIcon(tone: StatusName, color: string): ReactNode {
  switch (tone) {
    case "present":
      return <CheckCircleIcon color={color} />;
    case "late":
      return <ClockIcon color={color} />;
    case "absent":
      return <AlertCircleIcon color={color} />;
    case "idle":
    case "timeOut":
      return null;
  }
}

export function StatusPill({ label }: { label: StatusLabel }) {
  const theme = useTheme();
  const tone = theme.status[label.tone];
  const icon = toneIcon(label.tone, tone.text);

  return (
    <View
      style={{
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: tone.background,
        flexDirection: "row",
        gap: theme.space.xs,
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.xs,
      }}
    >
      {icon === null ? null : <View testID="status-pill-icon">{icon}</View>}
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
