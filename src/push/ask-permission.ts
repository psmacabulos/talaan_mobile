/**
 * Ask "Allow notifications?" at most once per app session, and only while
 * Android still lets the app ask: not once allowed, and not after a parent
 * refused twice. Without the flag, a parent who closed the prompt would be
 * asked again on every refetch of Home.
 *
 * The flag is module state, outside React, so Home re-rendering, or being
 * left and come back to, can't reset it.
 */
import {
  askPermission,
  ensureAttendanceChannel,
  getPermission,
} from "./notifications";
import { registerThisPhone } from "./registration";

let askedThisSession = false;

export async function askForPushPermissionOnce(): Promise<void> {
  if (askedThisSession) {
    return;
  }
  askedThisSession = true;

  try {
    // Android 13 and newer only show the prompt once a channel exists.
    await ensureAttendanceChannel();

    if (!(await getPermission()).canAsk) {
      return;
    }

    if (await askPermission()) {
      await registerThisPhone();
    }
  } catch {
    // No prompt is better than a crash; Android's settings can still allow it.
  }
}
