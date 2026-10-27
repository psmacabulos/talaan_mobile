/**
 * Times, shown on the school's clock.
 *
 * Every Bantay Aral school is in the Philippines: UTC+8 all year, no daylight
 * saving. The API sends times like `2026-10-13T07:56:00.000+08:00`.
 *
 * **A parent must see the time the tap happened at the school**, not the time
 * it was on their own phone. A mother working in Dubai looking at her son's
 * arrival wants "7:56 AM", which is when he walked through the gate — not
 * "3:56 AM", which is what her phone would say.
 *
 * So this never uses `toLocaleTimeString`, `Intl` or anything else that reads
 * the phone's zone: `Date.parse` gets the right instant from the offset in the
 * string, that instant is moved forward eight hours, and the **UTC** fields
 * are read. Support for named time zones also varies between Android phones,
 * which is the second reason not to rely on it.
 *
 * Ported from `reference/school-time.ts`, which is the copy of what Talaan's
 * web app does — the two must keep agreeing, or a parent and a teacher would
 * see different times for the same tap.
 */
import { strings } from "@/strings";

const SCHOOL_UTC_OFFSET_MINUTES = 8 * 60;
const MINUTE_MS = 60_000;

/** The instant moved onto the school's clock, so the UTC getters read school time. */
function onSchoolClock(iso: string): Date {
  return new Date(Date.parse(iso) + SCHOOL_UTC_OFFSET_MINUTES * MINUTE_MS);
}

/**
 * "7:56 AM" on the school's clock, whatever the phone is set to.
 *
 * Returns undefined for a time the app cannot read, so a card shows no time
 * rather than "Invalid Date".
 */
export function formatSchoolTime(iso: string): string | undefined {
  const clock = onSchoolClock(iso);

  if (Number.isNaN(clock.getTime())) {
    return undefined;
  }

  const hours24 = clock.getUTCHours();
  const minutes = clock.getUTCMinutes();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** The school's calendar date at that instant: "2026-06-20". */
export function schoolDateOf(iso: string): string {
  return onSchoolClock(iso).toISOString().slice(0, 10);
}

/**
 * The same, or undefined for a time the app can't read. `schoolDateOf` throws
 * on one (`toISOString` of an invalid date), which a list must never do.
 */
export function schoolDateOrUndefined(iso: string): string | undefined {
  return Number.isNaN(Date.parse(iso)) ? undefined : schoolDateOf(iso);
}

/**
 * "Monday, October 13, 2025": for a screen reader, where a row from an earlier
 * month may also be from an earlier year.
 */
export function formatSchoolDateWithYear(iso: string): string | undefined {
  const date = formatSchoolDate(iso);
  if (date === undefined) return undefined;

  return `${date}, ${onSchoolClock(iso).getUTCFullYear()}`;
}

/** "Mon", on the school's calendar. */
export function formatSchoolWeekdayShort(iso: string): string | undefined {
  const clock = onSchoolClock(iso);
  if (Number.isNaN(clock.getTime())) return undefined;

  return strings.weekdaysShort[clock.getUTCDay()];
}

/** "Monday", on the school's calendar. */
export function formatSchoolWeekday(iso: string): string | undefined {
  const clock = onSchoolClock(iso);
  if (Number.isNaN(clock.getTime())) return undefined;

  return strings.weekdays[clock.getUTCDay()];
}

/** "Oct 14", on the school's calendar. */
export function formatSchoolDateShort(iso: string): string | undefined {
  const clock = onSchoolClock(iso);
  if (Number.isNaN(clock.getTime())) return undefined;

  return `${strings.monthsShort[clock.getUTCMonth()]} ${clock.getUTCDate()}`;
}

/**
 * "Monday, October 13" on the school's calendar, from the app's own names.
 *
 * The weekday and month come from `src/strings.ts` rather than the phone, for
 * the same reason the time does: the answer must not change with where the
 * parent is standing, and it has to be translatable into Filipino later.
 */
export function formatSchoolDate(iso: string): string | undefined {
  const clock = onSchoolClock(iso);

  if (Number.isNaN(clock.getTime())) {
    return undefined;
  }

  const weekday = strings.weekdays[clock.getUTCDay()];
  const month = strings.months[clock.getUTCMonth()];

  return `${weekday}, ${month} ${clock.getUTCDate()}`;
}
