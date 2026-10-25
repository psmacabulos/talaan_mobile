/**
 * The school's clock, pinned down.
 *
 * The group that matters is the last one. A parent working in Dubai must see
 * the time their child walked through the gate in Balanga, not the time it
 * was where they are standing — so the rule is that nothing here may read the
 * phone's zone, and that is what gets asserted.
 */
import { formatSchoolTime } from "../school-time";

describe("a time on the school's clock", () => {
  test.each([
    ["2026-10-13T07:56:00.000+08:00", "7:56 AM", "a morning arrival"],
    ["2026-10-13T16:05:00.000+08:00", "4:05 PM", "an afternoon departure"],
    ["2026-10-13T00:00:00.000+08:00", "12:00 AM", "midnight is 12, not 0"],
    ["2026-10-13T12:00:00.000+08:00", "12:00 PM", "noon is 12 PM, not 12 AM"],
    ["2026-10-13T12:01:00.000+08:00", "12:01 PM", "just after noon"],
    ["2026-10-13T23:59:00.000+08:00", "11:59 PM", "the last minute of the day"],
    ["2026-10-13T09:05:00.000+08:00", "9:05 AM", "minutes are padded"],
  ])("%s reads as %s (%s)", (iso, expected) => {
    expect(formatSchoolTime(iso)).toBe(expected);
  });

  test("a time it cannot read gives nothing, not 'Invalid Date'", () => {
    expect(formatSchoolTime("not a time")).toBeUndefined();
  });
});

describe("the phone's time zone cannot change the answer", () => {
  /**
   * `toLocaleTimeString` and friends read the phone's zone, and Android's
   * support for named zones varies between handsets — which is exactly why
   * docs/PRODUCT-RULES.md forbids them here. Watching for the call is a
   * stronger test than pretending to be in another country, because it fails
   * the moment someone "simplifies" this to a locale call.
   */
  test("no locale formatter is used", () => {
    const localeTime = jest.spyOn(Date.prototype, "toLocaleTimeString");
    const localeDate = jest.spyOn(Date.prototype, "toLocaleDateString");
    const localeString = jest.spyOn(Date.prototype, "toLocaleString");

    formatSchoolTime("2026-10-13T07:56:00.000+08:00");

    expect(localeTime).not.toHaveBeenCalled();
    expect(localeDate).not.toHaveBeenCalled();
    expect(localeString).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test("the same instant written in UTC reads the same", () => {
    // 07:56 +08:00 is 23:56 the day before in UTC — the same moment, a
    // different wall clock, and the school's answer either way.
    expect(formatSchoolTime("2026-10-12T23:56:00.000Z")).toBe("7:56 AM");
  });

  test("an offset that is not +08:00 is still shown on the school's clock", () => {
    // A tap recorded as 02:56 in London is 09:56 in Balanga.
    expect(formatSchoolTime("2026-10-13T02:56:00.000+01:00")).toBe("9:56 AM");
  });
});
