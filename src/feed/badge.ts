/**
 * What the number on the Notifications tab should say.
 *
 * The server stops counting at 10 (docs/TALAAN-API.md), so a 10 means "ten or
 * more" and must not be shown as a flat "10" — a parent with thirty unread
 * notifications would be told there were ten. "9+" is the agreed wording, and
 * nothing is shown at all when there is nothing to read.
 */
import { strings } from "@/strings";

const SERVER_CAP = 10;

export function badgeValue(unreadCount: number): string | number | undefined {
  if (unreadCount <= 0) {
    return undefined;
  }

  return unreadCount >= SERVER_CAP ? strings.feed.badgeOverflow : unreadCount;
}
