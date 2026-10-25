/**
 * The words on a child's card, against docs/PRODUCT-RULES.md, "The words to
 * use".
 *
 * These are the same words the school's staff see in the web app. If they ever
 * drifted, a parent and a teacher would describe the same morning differently
 * — which is worse than either wording being wrong on its own.
 */
import type { ChildToday } from "@/api/schemas";
import { strings } from "@/strings";

import { notificationSentence, statusLabel } from "../status-words";

type Today = ChildToday["today"];

function today(over: Partial<Today>): Today {
  return {
    date: "2026-10-22",
    status: "idle",
    flexible: false,
    timeIn: null,
    timeOut: null,
    tapCount: 0,
    ...over,
  };
}

describe("on a school day", () => {
  test.each([
    ["present", strings.status.present],
    ["late", strings.status.late],
    ["absent", strings.status.absent],
    ["idle", strings.status.idle],
  ] as const)("%s reads as %s", (status, word) => {
    expect(statusLabel(today({ status })).word).toBe(word);
  });

  test.each([
    ["present", "present"],
    ["late", "late"],
    ["absent", "absent"],
    ["idle", "idle"],
  ] as const)("%s wears the %s colour", (status, tone) => {
    expect(statusLabel(today({ status })).tone).toBe(tone);
  });
});

describe("at a weekend", () => {
  // `flexible` means the school has no late and no absent that day.
  test("a child who came in has 'Came in', not 'Present'", () => {
    const label = statusLabel(today({ status: "present", flexible: true }));

    expect(label.word).toBe(strings.status.presentAtWeekend);
    expect(label.word).not.toBe(strings.status.present);
  });

  test("a child who did not tap has 'No tap', not 'Not yet tapped'", () => {
    const label = statusLabel(today({ status: "idle", flexible: true }));

    expect(label.word).toBe(strings.status.idleAtWeekend);
  });

  test("never says 'Absent' on a day that has no absent", () => {
    // Every status the server can send at a weekend, none of them accusing.
    const weekendWords = (["present", "idle"] as const).map(
      (status) => statusLabel(today({ status, flexible: true })).word,
    );

    expect(weekendWords).not.toContain(strings.status.absent);
    expect(weekendWords).not.toContain(strings.status.late);
  });

  test("keeps the same colours, so green still means the child is there", () => {
    expect(statusLabel(today({ status: "present", flexible: true })).tone).toBe(
      "present",
    );
  });
});

describe("what the school sends", () => {
  test.each([
    ["off", strings.card.sendsNothing],
    ["time_in_only", strings.card.sendsTimeIn],
    ["time_in_and_time_out", strings.card.sendsBoth],
  ] as const)("%s is said plainly", (preference, sentence) => {
    expect(notificationSentence(preference)).toBe(sentence);
  });

  test("a school that sends nothing says so, rather than staying quiet", () => {
    // A parent whose school has notifications off should find out here, not by
    // waiting all term for one that never arrives.
    expect(notificationSentence("off")).toMatch(/doesn't send/i);
  });
});
