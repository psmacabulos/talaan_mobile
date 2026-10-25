/**
 * The off-by-one that `toISOString()` would cause, pinned down.
 *
 * These run in whatever zone the machine is in, so the ones that matter build
 * their dates locally and assert the local answer — which is the bug: in any
 * zone ahead of UTC, `toISOString()` reports the day before.
 */
import { toCalendarDate } from "../calendar-date";

describe("the date a parent picked", () => {
  test("is the day they picked, not the day before", () => {
    // What a date picker hands back: local midnight on the chosen day.
    const picked = new Date(2014, 2, 3);

    expect(toCalendarDate(picked)).toBe("2014-03-03");
  });

  test("does not go through toISOString, which shifts the day east of UTC", () => {
    const picked = new Date(2014, 2, 3);
    const viaIso = picked.toISOString().slice(0, 10);

    // In Asia/Manila viaIso is "2014-03-02". Anywhere behind UTC they agree,
    // so this asserts the rule rather than the machine's zone.
    expect(toCalendarDate(picked)).toBe("2014-03-03");
    expect(toCalendarDate(picked) >= viaIso).toBe(true);
  });

  test("pads months and days to two digits", () => {
    expect(toCalendarDate(new Date(2012, 0, 5))).toBe("2012-01-05");
  });

  test("handles the last day of a year", () => {
    expect(toCalendarDate(new Date(2011, 11, 31))).toBe("2011-12-31");
  });

  test("handles a leap day", () => {
    expect(toCalendarDate(new Date(2012, 1, 29))).toBe("2012-02-29");
  });
});
