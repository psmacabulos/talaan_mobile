/**
 * The feed in sections: Today, Yesterday, Earlier this week, Earlier this
 * month, then one per month ("September 2026").
 *
 * Every date is the **school's** calendar date (`docs/PRODUCT-RULES.md`,
 * "Times and dates"), and `today` is passed in so one screen uses one answer:
 * a header and its rows must never disagree around midnight.
 *
 * Weeks start on Monday, like the school week. So on a Monday, Friday's taps
 * sit under "Earlier this month" (or their month), not "Earlier this week".
 *
 * Sections are keyed with a `Map`, not by "the same as the row before", so a
 * page boundary or an out-of-order row can never make two sections with the
 * same key.
 */
import type { Notification } from "@/api/schemas";
import { schoolDateOrUndefined } from "@/lib/school-time";
import { strings } from "@/strings";

/** Which section a row sits in. It decides how the row writes its time. */
export type FeedBucket =
  "today" | "yesterday" | "thisWeek" | "thisMonth" | "month" | "undated";

export type FeedSection = {
  key: string;
  title: string;
  bucket: FeedBucket;
  data: Notification[];
};

const DAY_MS = 86_400_000;

/** "2026-10-26" as a UTC midnight, so date maths never reads the phone's zone. */
function dayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`) / DAY_MS;
}

function dateOfDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** The bucket, and the section key, for one school date. */
export function bucketOf(
  date: string | undefined,
  today: string,
): { bucket: FeedBucket; key: string } {
  if (date === undefined) return { bucket: "undated", key: "undated" };

  const todayNumber = dayNumber(today);
  // 0 for Monday … 6 for Sunday.
  const sinceMonday = (new Date(todayNumber * DAY_MS).getUTCDay() + 6) % 7;
  const monday = dateOfDay(todayNumber - sinceMonday);
  const yesterday = dateOfDay(todayNumber - 1);

  // A date after today is a clock that's slightly ahead: it's still today.
  if (date >= today) return { bucket: "today", key: "today" };
  if (date === yesterday) return { bucket: "yesterday", key: "yesterday" };
  if (date >= monday) return { bucket: "thisWeek", key: "thisWeek" };
  if (date.slice(0, 7) === today.slice(0, 7)) {
    return { bucket: "thisMonth", key: "thisMonth" };
  }

  return { bucket: "month", key: date.slice(0, 7) };
}

function titleOf(bucket: FeedBucket, key: string): string {
  switch (bucket) {
    case "today":
      return strings.feed.sectionToday;
    case "yesterday":
      return strings.feed.sectionYesterday;
    case "thisWeek":
      return strings.feed.sectionThisWeek;
    case "thisMonth":
      return strings.feed.sectionThisMonth;
    case "undated":
      return strings.feed.sectionUndated;
    case "month": {
      const [year, month] = key.split("-").map(Number);
      return strings.feed.sectionMonth(
        strings.months[(month ?? 1) - 1] ?? key,
        year ?? 0,
      );
    }
  }
}

/** Rows newest first in, sections newest first out, each keeping row order. */
export function groupFeed(items: Notification[], today: string): FeedSection[] {
  const sections = new Map<string, FeedSection>();

  for (const item of items) {
    const { bucket, key } = bucketOf(schoolDateOrUndefined(item.at), today);
    const section = sections.get(key);

    if (section === undefined) {
      sections.set(key, {
        key,
        title: titleOf(bucket, key),
        bucket,
        data: [item],
      });
    } else {
      section.data.push(item);
    }
  }

  // A row whose time can't be read has no place in time order: it goes last.
  const all = [...sections.values()];
  return [
    ...all.filter((section) => section.bucket !== "undated"),
    ...all.filter((section) => section.bucket === "undated"),
  ];
}

/** Where a notification sits in the sections, or `null` if it isn't there. */
export function locateInSections(
  sections: FeedSection[],
  id: string,
): { sectionIndex: number; itemIndex: number } | null {
  for (const [sectionIndex, section] of sections.entries()) {
    const itemIndex = section.data.findIndex((item) => item.id === id);

    if (itemIndex !== -1) {
      return { sectionIndex, itemIndex };
    }
  }

  return null;
}
