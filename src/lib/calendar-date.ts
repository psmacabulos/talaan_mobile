/**
 * A date a parent picked, as the `YYYY-MM-DD` the server expects.
 *
 * **Built from the local date fields, never `toISOString()`.**
 *
 * A date picker hands back local midnight on the chosen day. In the
 * Philippines (UTC+8) local midnight is still the *previous* day in UTC, so
 * `toISOString()` shifts every date back by one:
 *
 *     parent picked      : Mon Mar 03 2014
 *     via toISOString()  : "2014-03-02"   ← wrong, and sent to the server
 *     via local fields   : "2014-03-03"
 *
 * That is not a rounding error anyone would spot. The server would answer
 * `404 not_found` — "no match" — for a child whose details the parent had
 * entered perfectly, and the only clue would be a birth date they could not
 * see any more. 2014-03-03 is the demo student's birth date
 * (`docs/SERVER.md`), so this would have broken the demo itself.
 */
function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function toCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = twoDigits(date.getMonth() + 1);
  const day = twoDigits(date.getDate());

  return `${year}-${month}-${day}`;
}
