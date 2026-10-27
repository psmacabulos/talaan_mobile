/**
 * The feed's sections, on the school's calendar: Today, Yesterday, Earlier
 * this week (weeks start Monday), Earlier this month, then one per month.
 */
import type { Notification } from "@/api/schemas";

import { bucketOf, groupFeed } from "../feed-groups";

// Wednesday, October 28, 2026. That week's Monday is October 26.
const WEDNESDAY = "2026-10-28";

function tapOn(date: string, id: string, time = "07:30"): Notification {
  return {
    id,
    childId: "student-0001",
    childName: "Maria Ramos",
    kind: "time_in",
    at: `${date}T${time}:00.000+08:00`,
    read: true,
  };
}

describe("which section a date is in", () => {
  test.each([
    ["2026-10-28", "today"],
    ["2026-10-27", "yesterday"],
    ["2026-10-26", "thisWeek"],
    ["2026-10-25", "thisMonth"],
    ["2026-10-01", "thisMonth"],
    ["2026-09-30", "month"],
    ["2025-12-31", "month"],
  ] as const)("on a Wednesday, %s is %s", (date, bucket) => {
    expect(bucketOf(date, WEDNESDAY).bucket).toBe(bucket);
  });

  test("on a Monday, last Friday is not 'this week'", () => {
    // The week starts Monday, like the school week.
    expect(bucketOf("2026-10-23", "2026-10-26").bucket).toBe("thisMonth");
  });

  test("on a Sunday, the Monday before is still this week", () => {
    expect(bucketOf("2026-10-26", "2026-11-01").bucket).toBe("thisWeek");
  });

  test("a week across two months stays one week", () => {
    // Thursday, October 1, 2026; that week's Monday is September 28.
    expect(bucketOf("2026-09-28", "2026-10-01").bucket).toBe("thisWeek");
  });

  test("New Year's Day: yesterday is last year's December 31", () => {
    expect(bucketOf("2026-12-31", "2027-01-01").bucket).toBe("yesterday");
    expect(bucketOf("2026-12-20", "2027-01-01").key).toBe("2026-12");
  });

  test("a date after today, from a clock slightly ahead, is today", () => {
    expect(bucketOf("2026-10-29", WEDNESDAY).bucket).toBe("today");
  });
});

describe("the sections", () => {
  test("come newest first, with their titles, keeping row order", () => {
    const sections = groupFeed(
      [
        tapOn("2026-10-28", "a", "16:05"),
        tapOn("2026-10-28", "b"),
        tapOn("2026-10-27", "c"),
        tapOn("2026-10-26", "d"),
        tapOn("2026-10-14", "e"),
        tapOn("2026-09-30", "f"),
        tapOn("2026-08-03", "g"),
      ],
      WEDNESDAY,
    );

    expect(
      sections.map((section) => [
        section.title,
        section.data.map((item) => item.id),
      ]),
    ).toEqual([
      ["Today", ["a", "b"]],
      ["Yesterday", ["c"]],
      ["Earlier this week", ["d"]],
      ["Earlier this month", ["e"]],
      ["September 2026", ["f"]],
      ["August 2026", ["g"]],
    ]);
  });

  test("a row out of order joins its section, never a second one", () => {
    // Pages can meet mid-day, or a late row can arrive between others.
    const sections = groupFeed(
      [
        tapOn("2026-10-28", "a"),
        tapOn("2026-10-27", "b"),
        tapOn("2026-10-28", "c"),
      ],
      WEDNESDAY,
    );

    expect(sections.map((section) => section.key)).toEqual([
      "today",
      "yesterday",
    ]);
    expect(sections[0]?.data.map((item) => item.id)).toEqual(["a", "c"]);
  });

  test("a row whose time can't be read goes in a last section, not a crash", () => {
    const sections = groupFeed(
      [
        { ...tapOn("2026-10-28", "a"), at: "not a time" },
        tapOn(WEDNESDAY, "b"),
      ],
      WEDNESDAY,
    );

    expect(sections.map((section) => section.title)).toEqual([
      "Today",
      "Date unknown",
    ]);
  });

  test("nothing in, nothing out", () => {
    expect(groupFeed([], WEDNESDAY)).toEqual([]);
  });
});
