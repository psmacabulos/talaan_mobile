/**
 * What each feed row says, against docs/TALAAN-API.md (the feed) and
 * docs/PRODUCT-RULES.md, "The words to use": the sentence, the time on the
 * right written for the row's section, and what a screen reader hears.
 */
import type { Notification } from "@/api/schemas";
import { strings } from "@/strings";

import { feedWords } from "../feed-words";

// Thursday, October 22, 2026, on the school's clock.
const tap: Notification = {
  id: "notification-1",
  childId: "student-0001",
  childName: "Juan Cruz",
  kind: "time_in",
  at: "2026-10-22T07:56:00.000+08:00",
  read: false,
};

const notice: Notification = {
  id: "notification-9",
  childId: "student-0001",
  childName: "Juan Cruz",
  kind: "guardian_linked",
  at: "2026-10-22T18:12:00.000+08:00",
  read: false,
  guardian: { firstName: "Ana", lastName: "Santos" },
};

describe("a tap", () => {
  test("says the sentence, with the time on the right", () => {
    expect(feedWords(tap, "today")).toEqual({
      text: "Juan Cruz tapped in",
      when: "7:56 AM",
      spoken: "Juan Cruz tapped in at 7:56 AM, today",
      opensChildDay: true,
    });
  });

  test("a time out says 'tapped out'", () => {
    const words = feedWords({ ...tap, kind: "time_out" }, "yesterday");

    expect(words.text).toBe("Juan Cruz tapped out");
    expect(words.spoken).toBe("Juan Cruz tapped out at 7:56 AM, yesterday");
  });
});

describe("the time on the right, by section", () => {
  test.each([
    ["today", "7:56 AM", "today"],
    ["yesterday", "7:56 AM", "yesterday"],
    ["thisWeek", "Thu 7:56 AM", "Thursday"],
    ["thisMonth", "Oct 22, 7:56 AM", "Thursday, October 22"],
    ["month", "Oct 22, 7:56 AM", "Thursday, October 22, 2026"],
  ] as const)("under %s it reads '%s'", (bucket, when, day) => {
    const words = feedWords(tap, bucket);

    expect(words.when).toBe(when);
    // A screen reader always hears the day: it may never land on the header.
    expect(words.spoken).toBe(`Juan Cruz tapped in at 7:56 AM, ${day}`);
  });

  test("a time it can't read is a dash, and isn't spoken as one", () => {
    const words = feedWords({ ...tap, at: "not a time" }, "undated");

    expect(words.when).toBe(strings.card.noTime);
    expect(words.spoken).toBe("Juan Cruz tapped in");
  });
});

describe("another parent linked a child", () => {
  test("names the account, in the contract's words, with the advice", () => {
    expect(feedWords(notice, "today")).toEqual({
      text: "An account named Ana Santos linked to Juan Cruz.",
      detail: "If you don't know them, contact the school.",
      when: "6:12 PM",
      spoken:
        "An account named Ana Santos linked to Juan Cruz. If you don't know them, contact the school. 6:12 PM, today",
      opensChildDay: false,
    });
  });

  test("is never worded or treated as a tap", () => {
    const words = feedWords(notice, "today");

    expect(words.text).not.toMatch(/tapped/);
    expect(words.opensChildDay).toBe(false);
  });

  test.each([
    ["their account is gone", null],
    ["there's no guardian", undefined],
    ["the name is blank", { firstName: "  ", lastName: "" }],
  ])("without a name when %s", (_, guardian) => {
    expect(feedWords({ ...notice, guardian }, "today").text).toBe(
      strings.feed.guardianLinkedNoName("Juan Cruz"),
    );
  });

  test("with one half of the name, uses that half", () => {
    const words = feedWords(
      { ...notice, guardian: { firstName: "Ana", lastName: " " } },
      "today",
    );

    expect(words.text).toBe("An account named Ana linked to Juan Cruz.");
  });

  test("from an earlier month, keeps the date and the time", () => {
    expect(feedWords(notice, "month").when).toBe("Oct 22, 6:12 PM");
  });
});
