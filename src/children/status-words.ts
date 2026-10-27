/**
 * Turning a child's status into the word a parent reads, and the colour it
 * wears, and their latest tap into "Out …" or "Back in …".
 *
 * Both come from docs/PRODUCT-RULES.md, "The words to use". The server decides
 * the status; this only chooses how to say it. The app never works out whether
 * a child is late — that is the school's rule, on the school's clock, and it
 * arrives already decided (CLAUDE.md, "The backend is somewhere else").
 *
 * **Weekends are different.** When `today.flexible` is true the school has no
 * late and no absent, so "Present" becomes "Came in" and the rather accusing
 * "Not yet tapped" becomes "No tap". A parent should never see "Absent"
 * against a Saturday.
 */
import type { ChildToday } from "@/api/schemas";
import { formatSchoolTime } from "@/lib/school-time";
import { strings } from "@/strings";
import type { StatusName } from "@/theme";

type Today = ChildToday["today"];

/**
 * The word, and which of the five status colours carries it. The colour never
 * carries the meaning on its own — the pill always shows the word too
 * (docs/DESIGN.md, rule 3).
 */
export type StatusLabel = {
  word: string;
  tone: StatusName;
};

export function statusLabel(
  // Only these two decide the word. Narrowed so a caller with just a day's
  // status — the child-day screen — need not invent times and counts it does
  // not have.
  today: Pick<Today, "status" | "flexible">,
): StatusLabel {
  const { status, flexible } = today;

  switch (status) {
    case "present":
      return {
        word: flexible
          ? strings.status.presentAtWeekend
          : strings.status.present,
        tone: "present",
      };

    case "late":
      // The server does not send this at a weekend; if it ever did, the plain
      // word is still the honest one.
      return { word: strings.status.late, tone: "late" };

    case "absent":
      return { word: strings.status.absent, tone: "absent" };

    case "idle":
      return {
        word: flexible ? strings.status.idleAtWeekend : strings.status.idle,
        tone: "idle",
      };
  }
}

/** The latest tap as the card shows it, and as a screen reader says it. */
export type LatestTapWords = {
  /** Whether the server counted it as an in or an out. */
  kind: "time_in" | "time_out";
  /** "Out" or "Back in", shown over the time. */
  label: string;
  /** "4:05 PM", on the school's clock. */
  time: string;
  /** "Out at 4:05 PM", for a screen reader. */
  spoken: string;
};

/**
 * "Out" over "4:05 PM", or "Back in" over "7:05 PM", from the second tap on.
 *
 * With one tap the latest is the time in already on the card, so there is
 * nothing more to say. The server decides whether the tap was an in or an out;
 * this only chooses the words for it.
 */
export function latestTapWords(
  today: Pick<Today, "tapCount" | "latest">,
): LatestTapWords | undefined {
  const { tapCount, latest } = today;
  if (tapCount < 2 || latest === null || latest === undefined) return undefined;

  const time = formatSchoolTime(latest.at);
  if (time === undefined) return undefined;

  switch (latest.kind) {
    case "time_out":
      return {
        kind: latest.kind,
        label: strings.card.latestOut,
        time,
        spoken: strings.card.latestOutSpoken(time),
      };
    case "time_in":
      return {
        kind: latest.kind,
        label: strings.card.latestBackIn,
        time,
        spoken: strings.card.latestBackInSpoken(time),
      };
  }
}

/**
 * What the school sends, said plainly. A parent whose school has notifications
 * off should learn it here rather than by waiting for one that never comes.
 */
export function notificationSentence(
  preference: ChildToday["school"]["notificationPreference"],
): string {
  switch (preference) {
    case "off":
      return strings.card.sendsNothing;
    case "time_in_only":
      return strings.card.sendsTimeIn;
    case "time_in_and_time_out":
      return strings.card.sendsBoth;
  }
}
