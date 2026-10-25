/**
 * One child's day, as a parent sees it.
 *
 * This is the card the whole demo is built toward: the push notification in
 * M7 exists to make a parent open the app and look at this.
 *
 * Everything on it is decided by the server. The app does not work out
 * whether a child is late, or which taps were arrivals — it shows the
 * `status`, the `kind` and the times it was given (CLAUDE.md, "The backend is
 * somewhere else"). Times are drawn on the **school's** clock, so a parent
 * working abroad sees when their child walked through the gate in Balanga.
 */
import { Text, View } from "react-native";

import type { ChildToday } from "@/api/schemas";
import { notificationSentence, statusLabel } from "@/children/status-words";
import { formatSchoolTime } from "@/lib/school-time";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

import { ChildPhoto } from "./child-photo";
import { StatusPill } from "./status-pill";

const PHOTO_WIDTH = 80;

export function ChildCard({ child }: { child: ChildToday }) {
  const theme = useTheme();
  const label = statusLabel(child.today);

  const timeIn =
    child.today.timeIn === null
      ? undefined
      : formatSchoolTime(child.today.timeIn);
  const timeOut =
    child.today.timeOut === null
      ? undefined
      : formatSchoolTime(child.today.timeOut);

  // A child can leave and come back. More than two taps means the pair of
  // times above no longer tells the whole story (docs/PRODUCT-RULES.md).
  const manyTaps = child.today.tapCount > 2;

  return (
    <View
      // One swipe per child in TalkBack, rather than six stops for the parts
      // of one card. Android ignores roles inside an accessible group, which
      // is why the name below is no longer marked as a header.
      accessible
      accessibilityLabel={[
        `${child.firstName} ${child.lastName}`,
        strings.child.gradeAndSection(child.gradeLevel, child.section),
        child.school.name,
        label.word,
        timeIn ? `${strings.card.timeIn} ${timeIn}` : undefined,
        timeOut ? `${strings.card.timeOut} ${timeOut}` : undefined,
      ]
        .filter(Boolean)
        .join(". ")}
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.space.base,
        padding: theme.space.base,
      }}
    >
      <View style={{ flexDirection: "row", gap: theme.space.base }}>
        <ChildPhoto child={child} width={PHOTO_WIDTH} />

        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fontFamily.headingBold,
              fontSize: theme.fontSize.md,
            }}
          >
            {child.firstName} {child.lastName}
          </Text>

          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
            }}
          >
            {strings.child.gradeAndSection(child.gradeLevel, child.section)}
          </Text>

          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fontFamily.body,
              fontSize: theme.fontSize.sm,
            }}
          >
            {child.school.name}
          </Text>

          <StatusPill label={label} />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.space.xl }}>
        <TimeOfDay label={strings.card.timeIn} time={timeIn} />
        <TimeOfDay label={strings.card.timeOut} time={timeOut} />
      </View>

      {manyTaps ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.sm,
          }}
        >
          {strings.card.tapsToday(child.today.tapCount)}
        </Text>
      ) : null}

      <Text
        style={{
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.xs,
          paddingTop: theme.space.md,
        }}
      >
        {notificationSentence(child.school.notificationPreference)}
      </Text>
    </View>
  );
}

/** "Time in" over "7:56 AM", or over a dash when it hasn't happened. */
function TimeOfDay({ label, time }: { label: string; time?: string }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs }}>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fontFamily.body,
          fontSize: theme.fontSize.xs,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: time ? theme.colors.foreground : theme.colors.mutedForeground,
          // Lexend for every number and time (docs/DESIGN.md).
          fontFamily: theme.fontFamily.heading,
          fontSize: theme.fontSize.md,
        }}
      >
        {time ?? strings.card.noTime}
      </Text>
    </View>
  );
}
