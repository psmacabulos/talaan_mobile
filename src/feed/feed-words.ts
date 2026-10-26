/**
 * What one feed row says, for each kind of notification.
 *
 * The switch below is exhaustive: when Talaan adds a kind and the schema
 * learns it, typecheck fails here until the kind has its own words. That is
 * how `guardian_linked` was once dropped without anyone noticing
 * (docs/PROBLEMS-LOG.md, P-013), and how a new kind can never end up worded
 * as a tap.
 */
import type { Notification } from "@/api/schemas";
import {
  formatSchoolDate,
  formatSchoolTime,
  schoolDateOf,
} from "@/lib/school-time";
import { strings } from "@/strings";

export type FeedWords = {
  /** The sentence: "Juan Cruz tapped in at 7:56 AM". */
  text: string;
  /** A second, quieter line, when the kind has advice to give. */
  detail?: string;
  /** Small text on the right: when it happened, beyond what `text` says. */
  when?: string;
  /** Whether pressing the row opens the child's day: only a tap does. */
  opensChildDay: boolean;
};

/**
 * @param today the school's date now, `YYYY-MM-DD`. Passed in rather than read
 * here so the words don't depend on the moment a test runs.
 */
export function feedWords(item: Notification, today: string): FeedWords {
  const time = formatSchoolTime(item.at) ?? strings.card.noTime;
  // On the school's calendar, which is the one the notice was recorded
  // against. Undefined for today: the time alone reads fine for this morning.
  const day =
    schoolDateOf(item.at) === today ? undefined : formatSchoolDate(item.at);

  switch (item.kind) {
    case "time_in":
      return {
        text: strings.feed.tappedIn(item.childName, time),
        when: day,
        opensChildDay: true,
      };

    case "time_out":
      return {
        text: strings.feed.tappedOut(item.childName, time),
        when: day,
        opensChildDay: true,
      };

    case "guardian_linked": {
      const name = guardianName(item.guardian);

      return {
        text:
          name === undefined
            ? strings.feed.guardianLinkedNoName(item.childName)
            : strings.feed.guardianLinked(name, item.childName),
        detail: strings.feed.guardianLinkedAdvice,
        // A security notice keeps its time even from an earlier day: when
        // the link happened is part of what a parent needs to know.
        when: day === undefined ? time : strings.feed.dayAndTime(day, time),
        opensChildDay: false,
      };
    }

    default: {
      const unhandled: never = item;
      return unhandled;
    }
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
