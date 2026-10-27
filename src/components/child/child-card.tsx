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
 *
 * The times sit in a panel, as the owner's design has it
 * (`design/BantayAral Children Dashboard Comparison.png`): the time in, and
 * beside it, from the second tap on, the newest tap: "Out" over "4:05 PM" or
 * "Back in" over "7:05 PM". A separate time out can't tell those apart, since
 * the server only sends one when the last tap was an out (Talaan Step 59.3).
 * An older server without `latest` gets the time in and time out as before.
 *
 * Each time has a coloured tile: green for an arrival, blue for leaving (not
 * the design's red, which in this app only ever means Absent), and grey until
 * a time in exists, so a dash never sits beside a reassuring green.
 *
 * Nothing else. A parent looks for one thing, whether their child is in and
 * on time, so the card has the name, the grade and section, the status and
 * the times, and two fit on a phone without scrolling. The school's name and
 * what it sends were taken off at the owner's request: a parent knows their
 * school (2026-10-27).
 */
import { Fragment, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import type { ChildToday } from "@/api/schemas";
import { latestTapWords, statusLabel } from "@/children/status-words";
import { IconTile } from "@/components/icon-tile";
import {
  ArrowInIcon,
  ArrowOutIcon,
  ChevronRightIcon,
} from "@/components/icons/ui-icons";
import { formatSchoolTime } from "@/lib/school-time";
import { useLargeText } from "@/lib/use-large-text";
import { strings } from "@/strings";
import { useTheme } from "@/theme";

import { ChildPhoto } from "./child-photo";
import { StatusPill } from "./status-pill";

/** 64 × 80: as tall as the name, the grade and the status beside it. */
const PHOTO_WIDTH = 64;

export function ChildCard({
  child,
  onPress,
}: {
  child: ChildToday;
  /** Opens this child's day. The whole card is the target. */
  onPress: () => void;
}) {
  const theme = useTheme();
  const label = statusLabel(child.today);

  const timeIn =
    child.today.timeIn === null
      ? undefined
      : formatSchoolTime(child.today.timeIn);

  // An older server sends no `latest`: keep its time in and time out pair.
  const hasLatest = child.today.latest !== undefined;
  const timeOut =
    hasLatest || child.today.timeOut === null
      ? undefined
      : formatSchoolTime(child.today.timeOut);
  const latest = latestTapWords(child.today);

  const halves: TimeHalfProps[] = [
    {
      id: "timeIn",
      label: strings.card.timeIn,
      time: timeIn,
      direction: "in",
      tile:
        timeIn === undefined
          ? theme.status.idle.text
          : theme.status.present.text,
    },
  ];
  if (latest !== undefined) {
    halves.push({
      id: "latest",
      label: latest.label,
      time: latest.time,
      direction: latest.kind === "time_out" ? "out" : "in",
      tile:
        latest.kind === "time_out"
          ? theme.status.timeOut.text
          : theme.status.present.text,
    });
  } else if (!hasLatest) {
    halves.push({
      id: "latest",
      label: strings.card.timeOut,
      time: timeOut,
      direction: "out",
      tile:
        timeOut === undefined
          ? theme.status.idle.text
          : theme.status.timeOut.text,
    });
  }

  // A child can leave and come back. More than two taps means the times
  // above no longer tell the whole story (docs/PRODUCT-RULES.md).
  const tapsToday =
    child.today.tapCount > 2
      ? strings.card.tapsToday(child.today.tapCount)
      : undefined;

  return (
    <Pressable
      // One swipe per child in TalkBack, rather than six stops for the parts
      // of one card. Android ignores roles inside an accessible group, which
      // is why the name below is no longer marked as a header.
      accessible
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={[
        `${child.firstName} ${child.lastName}`,
        strings.child.gradeAndSection(child.gradeLevel, child.section),
        label.word,
        timeIn ? `${strings.card.timeIn} ${timeIn}` : undefined,
        timeOut ? `${strings.card.timeOut} ${timeOut}` : undefined,
        latest?.spoken,
        tapsToday,
      ]
        .filter(Boolean)
        .join(". ")}
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.space.md,
        padding: theme.space.base,
      }}
    >
      <View style={{ flexDirection: "row", gap: theme.space.md }}>
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

          <StatusPill label={label} />
        </View>

        <View style={{ justifyContent: "center" }}>
          <ChevronRightIcon color={theme.colors.mutedForeground} />
        </View>
      </View>

      <TimesPanel halves={halves} />

      {tapsToday ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fontFamily.body,
            fontSize: theme.fontSize.sm,
          }}
        >
          {tapsToday}
        </Text>
      ) : null}
    </Pressable>
  );
}

type TimeHalfProps = {
  /** Fixed, unlike the label, which a translation may change. */
  id: "timeIn" | "latest";
  label: string;
  /** Undefined until it has happened: a dash. */
  time?: string;
  direction: "in" | "out";
  /** The tile's fill: a status colour's `text`. */
  tile: string;
};

/**
 * The time in and the latest tap, side by side with a divider, or stacked at
 * large text sizes. A wrapping row would strand its divider, so it's one or
 * the other.
 */
function TimesPanel({ halves }: { halves: TimeHalfProps[] }) {
  const theme = useTheme();
  const stacked = useLargeText();

  return (
    <View
      testID="times-panel"
      style={{
        backgroundColor: theme.colors.muted,
        borderRadius: theme.radius.md,
        flexDirection: stacked ? "column" : "row",
        gap: theme.space.md,
        padding: theme.space.md,
      }}
    >
      {halves.map((half, index) => (
        <Fragment key={half.id}>
          {index === 0 ? null : (
            <View
              style={{
                backgroundColor: theme.colors.border,
                ...(stacked ? { height: 1 } : { width: 1 }),
              }}
            />
          )}
          <TimeHalf {...half} stacked={stacked} />
        </Fragment>
      ))}
    </View>
  );
}

/** A tile, then "Time in" over "7:56 AM", or over a dash. */
function TimeHalf({
  id,
  label,
  time,
  direction,
  tile,
  stacked,
}: TimeHalfProps & { stacked: boolean }) {
  const theme = useTheme();
  const icon: ReactNode =
    direction === "in" ? (
      <ArrowInIcon color={theme.colors.card} />
    ) : (
      <ArrowOutIcon color={theme.colors.card} />
    );

  return (
    <View
      style={{
        alignItems: "center",
        // Halves share a row equally. Stacked, each is its own height: `flex`
        // in a column with no height of its own can squash them.
        ...(stacked ? {} : { flex: 1 }),
        flexDirection: "row",
        gap: theme.space.md,
      }}
    >
      <IconTile background={tile} testID={`tile-${id}`}>
        {icon}
      </IconTile>

      <View style={{ flexShrink: 1, gap: theme.space.xs }}>
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
            color: time
              ? theme.colors.foreground
              : theme.colors.mutedForeground,
            // Lexend for every number and time (docs/DESIGN.md).
            fontFamily: theme.fontFamily.headingBold,
            fontSize: theme.fontSize.md,
          }}
        >
          {time ?? strings.card.noTime}
        </Text>
      </View>
    </View>
  );
}
