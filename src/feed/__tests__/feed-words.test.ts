/**
 * What each feed row says, against docs/TALAAN-API.md (the feed) and
 * docs/PRODUCT-RULES.md, "The words to use".
 */
import type { Notification } from "@/api/schemas";
import { strings } from "@/strings";

import { feedWords } from "../feed-words";

const TODAY = "2026-10-22";

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
  test("says the time in the sentence, and nothing on the right today", () => {
    expect(feedWords(tap, TODAY)).toEqual({
      text: "Juan Cruz tapped in at 7:56 AM",
      when: undefined,
      opensChildDay: true,
    });
  });

  test("a time out says 'tapped out'", () => {
    expect(feedWords({ ...tap, kind: "time_out" }, TODAY).text).toBe(
      "Juan Cruz tapped out at 7:56 AM",
    );
  });

  test("from an earlier day, names the day", () => {
    expect(feedWords(tap, "2026-10-23").when).toBe("Thursday, October 22");
  });
});

describe("another parent linked a child", () => {
  test("names the account, in the contract's words, with the advice", () => {
    expect(feedWords(notice, TODAY)).toEqual({
      text: "An account named Ana Santos linked to Juan Cruz.",
      detail: "If you don't know them, contact the school.",
      when: "6:12 PM",
      opensChildDay: false,
    });
  });

  test("is never worded or treated as a tap", () => {
    const words = feedWords(notice, TODAY);

    expect(words.text).not.toMatch(/tapped/);
    expect(words.opensChildDay).toBe(false);
  });

  test.each([
    ["their account is gone", null],
    ["there's no guardian", undefined],
    ["the name is blank", { firstName: "  ", lastName: "" }],
  ])("without a name when %s", (_, guardian) => {
    expect(feedWords({ ...notice, guardian }, TODAY).text).toBe(
      strings.feed.guardianLinkedNoName("Juan Cruz"),
    );
  });

  test("with one half of the name, uses that half", () => {
    const words = feedWords(
      { ...notice, guardian: { firstName: "Ana", lastName: " " } },
      TODAY,
    );

    expect(words.text).toBe("An account named Ana linked to Juan Cruz.");
  });

  test("from an earlier day, keeps the time as well as the day", () => {
    expect(feedWords(notice, "2026-10-23").when).toBe(
      "Thursday, October 22, 6:12 PM",
    );
  });
});
