/**
 * What one feed row says, for each kind of notification.
 *
 * The switch below is exhaustive: when Talaan adds a kind and the schema
 * learns it, typecheck fails here until the kind has its own words. That is
 * how `guardian_linked` was once dropped without anyone noticing
 * (docs/PROBLEMS-LOG.md, P-013), and how a new kind can never end up worded
 * as a tap.
 *
 * The row's section decides how its time is written: "7:12 AM" under Today,
 * "Mon 7:30 AM" under Earlier this week, "Oct 14, 4:10 PM" further back. A
 * screen reader always hears the day too, since someone moving from row to
 * row may never land on the section header.
 */
import type { Notification } from "@/api/schemas";
import {
  formatSchoolDate,
  formatSchoolDateShort,
  formatSchoolDateWithYear,
  formatSchoolTime,
  formatSchoolWeekday,
  formatSchoolWeekdayShort,
} from "@/lib/school-time";
import { strings } from "@/strings";

import type { FeedBucket } from "./feed-groups";

export type FeedWords = {
  /** The sentence: "Juan Cruz tapped in". */
  text: string;
  /** A second, quieter line, when the kind has advice to give. */
  detail?: string;
  /** Small text on the right: "7:12 AM", "Mon 7:30 AM", "Oct 14, 4:10 PM". */
  when: string;
  /** Everything above in one sentence, with the day, for a screen reader. */
  spoken: string;
  /** Whether pressing the row opens the child's day: only a tap does. */
  opensChildDay: boolean;
};

export function feedWords(item: Notification, bucket: FeedBucket): FeedWords {
  const time = formatSchoolTime(item.at);
  const when = whenOf(item.at, time, bucket);
  const day = spokenDayOf(item.at, bucket);

  switch (item.kind) {
    case "time_in":
    case "time_out": {
      const tappedIn = item.kind === "time_in";
      const sentence =
        time === undefined
          ? tappedIn
            ? strings.feed.tappedIn(item.childName)
            : strings.feed.tappedOut(item.childName)
          : tappedIn
            ? strings.feed.tappedInAt(item.childName, time)
            : strings.feed.tappedOutAt(item.childName, time);

      return {
        text: tappedIn
          ? strings.feed.tappedIn(item.childName)
          : strings.feed.tappedOut(item.childName),
        when,
        spoken: [sentence, day].filter(Boolean).join(", "),
        opensChildDay: true,
      };
    }

    case "guardian_linked": {
      const name = guardianName(item.guardian);
      const text =
        name === undefined
          ? strings.feed.guardianLinkedNoName(item.childName)
          : strings.feed.guardianLinked(name, item.childName);
      const detail = strings.feed.guardianLinkedAdvice;

      return {
        text,
        detail,
        when,
        spoken: [text, detail, [time, day].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(" "),
        opensChildDay: false,
      };
    }

    default: {
      const unhandled: never = item;
      return unhandled;
    }
  }
}

/** The time on the right, written for the section the row sits in. */
function whenOf(
  at: string,
  time: string | undefined,
  bucket: FeedBucket,
): string {
  if (time === undefined) return strings.card.noTime;

  switch (bucket) {
    case "today":
    case "yesterday":
      return time;
    case "thisWeek": {
      const weekday = formatSchoolWeekdayShort(at);
      return weekday === undefined
        ? time
        : strings.feed.weekdayAndTime(weekday, time);
    }
    case "thisMonth":
    case "month": {
      const date = formatSchoolDateShort(at);
      return date === undefined ? time : strings.feed.dateAndTime(date, time);
    }
    case "undated":
      return strings.card.noTime;
  }
}

/**
 * "today", "yesterday", "Monday", "Monday, October 19", or, from an earlier
 * month, "Monday, October 13, 2025": the header names the month and year, but
 * a screen reader moving row by row may not hear it.
 */
function spokenDayOf(at: string, bucket: FeedBucket): string | undefined {
  switch (bucket) {
    case "today":
      return strings.feed.spokenToday;
    case "yesterday":
      return strings.feed.spokenYesterday;
    case "thisWeek":
      return formatSchoolWeekday(at);
    case "thisMonth":
      return formatSchoolDate(at);
    case "month":
      return formatSchoolDateWithYear(at);
    case "undated":
      return undefined;
  }
}

/** "Ana Santos", or undefined when there's no name to show. */
function guardianName(
  guardian: { firstName: string; lastName: string } | null | undefined,
): string | undefined {
  if (guardian === null || guardian === undefined) return undefined;

  const name = [guardian.firstName.trim(), guardian.lastName.trim()]
    .filter((part) => part !== "")
    .join(" ");

  return name === "" ? undefined : name;
}
